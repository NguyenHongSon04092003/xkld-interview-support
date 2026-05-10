import os
import re
import threading
import unicodedata

import torch
from fastapi import FastAPI
from pydantic import BaseModel, Field
from transformers import AutoModel, AutoTokenizer

try:
    from underthesea import word_tokenize
except Exception:
    word_tokenize = None


class ScoreRequest(BaseModel):
    answer_text: str = ""
    sample_answer: str = ""
    keywords: list[str] = Field(default_factory=list)


class ScoreResponse(BaseModel):
    content_score: float
    semantic_score: float
    keyword_score: float
    feedback: str


app = FastAPI(title="XKLD PhoBERT Scoring Service")

model_name = os.getenv("PHOBERT_MODEL_NAME", "vinai/phobert-base")
tokenizer = None
model = None
model_lock = threading.Lock()


def load_model():
    global tokenizer, model

    if tokenizer is not None and model is not None:
        return

    with model_lock:
        if tokenizer is not None and model is not None:
            return

        loaded_tokenizer = AutoTokenizer.from_pretrained(model_name)
        loaded_model = AutoModel.from_pretrained(model_name)
        loaded_model.eval()

        tokenizer = loaded_tokenizer
        model = loaded_model


@app.get("/")
def root():
    return {"message": "XKLD PhoBERT scoring service is running"}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/score", response_model=ScoreResponse)
def score(payload: ScoreRequest):
    answer_text = (payload.answer_text or "").strip()
    sample_answer = payload.sample_answer or ""
    keywords = payload.keywords or []

    if not answer_text:
        return {
            "content_score": 0.0,
            "semantic_score": 0.0,
            "keyword_score": 0.0,
            "feedback": "Cau tra loi qua ngan",
        }

    keyword_score = compute_keyword_score(answer_text, keywords)
    length_score = compute_length_score(answer_text)
    word_count = count_words(answer_text)

    try:
        semantic_score = compute_similarity(answer_text, sample_answer)
        used_fallback = False
    except Exception as exc:
        print(f"[ai-service] semantic scoring failed: {exc}")
        semantic_score = compute_keyword_fallback_score(
            answer_text,
            sample_answer,
            keyword_score,
        )
        used_fallback = True

    content_score = (
        semantic_score * 0.5 + keyword_score * 0.3 + length_score * 0.2
    )
    if used_fallback:
        content_score = keyword_score * 0.7 + length_score * 0.3

    if word_count < 10:
        content_score = min(content_score, 39.0)

    return {
        "content_score": round(content_score, 2),
        "semantic_score": round(semantic_score, 2),
        "keyword_score": round(keyword_score, 2),
        "feedback": build_feedback(semantic_score, keyword_score, length_score),
    }


def compute_similarity(text1, text2):
    if not text1 or not text2:
        return 0.0

    embedding1 = get_embedding(text1)
    embedding2 = get_embedding(text2)
    similarity = cosine_similarity(embedding1, embedding2)

    return max(0.0, min(float(similarity) * 100, 100.0))


def get_embedding(text):
    load_model()

    normalized_text = normalize_text(text)
    inputs = tokenizer(
        normalized_text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256,
    )

    with torch.no_grad():
        outputs = model(**inputs)

    token_embeddings = outputs.last_hidden_state
    attention_mask = inputs["attention_mask"].unsqueeze(-1)
    masked_embeddings = token_embeddings * attention_mask
    summed_embeddings = masked_embeddings.sum(dim=1)
    token_counts = attention_mask.sum(dim=1).clamp(min=1)
    embedding = summed_embeddings / token_counts

    return embedding.squeeze(0)


def cosine_similarity(embedding1, embedding2):
    dot_product = torch.dot(embedding1, embedding2)
    norm_product = torch.norm(embedding1) * torch.norm(embedding2)

    if norm_product.item() == 0.0:
        return 0.0

    return (dot_product / norm_product).item()


def normalize_text(text):
    return " ".join(tokenize(text))


def normalize_for_matching(text):
    text = (text or "").strip().lower()
    decomposed = unicodedata.normalize("NFD", text)
    without_marks = "".join(
        char for char in decomposed if unicodedata.category(char) != "Mn"
    )

    return without_marks.replace("Ä‘", "d")


def tokenize(text):
    text = text or ""

    if word_tokenize is not None:
        return word_tokenize(text)

    return re.findall(r"\w+", text, flags=re.UNICODE)


def compute_keyword_score(answer_text, keywords):
    if not keywords:
        return 100.0

    normalized_answer = normalize_for_matching(answer_text)
    matched_count = sum(
        1
        for keyword in keywords
        if keyword and normalize_for_matching(keyword) in normalized_answer
    )

    return (matched_count / len(keywords)) * 100


def compute_length_score(answer_text):
    word_count = count_words(answer_text)

    if word_count < 10:
        return 30.0
    if word_count <= 50:
        return 100.0
    return 80.0


def count_words(text):
    return len(tokenize(text or ""))


def compute_keyword_fallback_score(answer_text, sample_answer, keyword_score):
    sample_tokens = set(
        normalize_for_matching(sample_answer).replace("_", " ").split()
    )
    answer_tokens = set(
        normalize_for_matching(answer_text).replace("_", " ").split()
    )

    if not sample_tokens or not answer_tokens:
        return keyword_score

    overlap_score = (len(sample_tokens & answer_tokens) / len(sample_tokens)) * 100
    return max(keyword_score, overlap_score)


def build_feedback(semantic_score, keyword_score, length_score):
    feedback_parts = []

    if semantic_score > 70:
        feedback_parts.append("Cau tra loi dung trong tam")
    elif semantic_score >= 40:
        feedback_parts.append("Cau tra loi chua du y chinh")
    else:
        feedback_parts.append("Cau tra loi lac de, can xem lai")

    if keyword_score < 50:
        feedback_parts.append("Thieu mot so tu khoa quan trong")
    if length_score < 60:
        feedback_parts.append("Cau tra loi qua ngan")

    return ". ".join(feedback_parts)
