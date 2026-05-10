import threading
import unicodedata

import torch
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoModel, AutoTokenizer
from underthesea import word_tokenize

from models.interview_question import InterviewQuestion
from models.question_keyword import QuestionKeyword


class PhoBERTScorer:
    def __init__(self):
        self.model_name = "vinai/phobert-base"
        self.tokenizer = None
        self.model = None
        self.is_loading = False
        self.is_loaded = False
        self.load_error = None
        self._lock = threading.Lock()

    def load_model(self):
        with self._lock:
            if self.is_loaded or self.is_loading:
                return
            self.is_loading = True
            self.load_error = None

        try:
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            model = AutoModel.from_pretrained(self.model_name)
            model.eval()

            with self._lock:
                self.tokenizer = tokenizer
                self.model = model
                self.is_loaded = True
        except Exception as exc:
            with self._lock:
                self.load_error = str(exc)
            raise
        finally:
            with self._lock:
                self.is_loading = False

    def get_embedding(self, text):
        if not self.is_loaded or self.tokenizer is None or self.model is None:
            raise RuntimeError("Model dang khoi dong")

        normalized_text = self._normalize_text(text)
        inputs = self.tokenizer(
            normalized_text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=256,
        )

        with torch.no_grad():
            outputs = self.model(**inputs)

        token_embeddings = outputs.last_hidden_state
        attention_mask = inputs["attention_mask"].unsqueeze(-1)
        masked_embeddings = token_embeddings * attention_mask
        summed_embeddings = masked_embeddings.sum(dim=1)
        token_counts = attention_mask.sum(dim=1).clamp(min=1)
        embedding = summed_embeddings / token_counts

        return embedding.squeeze(0).cpu().numpy()

    def compute_similarity(self, text1, text2):
        if not text1 or not text2:
            return 0.0

        embedding1 = self.get_embedding(text1).reshape(1, -1)
        embedding2 = self.get_embedding(text2).reshape(1, -1)
        similarity = cosine_similarity(embedding1, embedding2)[0][0]

        return max(0.0, min(float(similarity) * 100, 100.0))

    def score_answer(self, question_id, answer_text, db):
        question = (
            db.query(InterviewQuestion)
            .filter(InterviewQuestion.id == question_id)
            .first()
        )

        if question is None:
            raise ValueError("Interview question not found")

        sample_answer = question.sample_answer or ""
        answer_text = (answer_text or "").strip()
        keywords = [
            keyword.keyword
            for keyword in db.query(QuestionKeyword)
            .filter(QuestionKeyword.question_id == question_id)
            .all()
        ]

        print(
            "[PhoBERTScorer] question_id=",
            question_id,
            "sample_answer=",
            sample_answer,
            "keywords=",
            keywords,
        )

        if not answer_text:
            print(
                "[PhoBERTScorer] semantic_score=0 keyword_score=0 "
                "length_score=0 content_score=0 reason=empty_answer"
            )
            return {
                "content_score": 0.0,
                "semantic_score": 0.0,
                "keyword_score": 0.0,
                "feedback": "Cau tra loi qua ngan",
            }

        keyword_score = self._compute_keyword_score(answer_text, keywords)
        length_score = self._compute_length_score(answer_text)
        word_count = self._count_words(answer_text)
        used_fallback = False

        try:
            semantic_score = self.compute_similarity(answer_text, sample_answer)
        except RuntimeError:
            used_fallback = True
            semantic_score = self._compute_keyword_fallback_score(
                answer_text,
                sample_answer,
                keyword_score,
            )
        except Exception as exc:
            used_fallback = True
            print(f"[PhoBERTScorer] cosine similarity failed: {exc}")
            semantic_score = self._compute_keyword_fallback_score(
                answer_text,
                sample_answer,
                keyword_score,
            )

        content_score = (
            semantic_score * 0.5 + keyword_score * 0.3 + length_score * 0.2
        )
        if used_fallback:
            content_score = keyword_score * 0.7 + length_score * 0.3

        if word_count < 10:
            content_score = min(content_score, 39.0)

        feedback = self._build_feedback(
            semantic_score,
            keyword_score,
            length_score,
        )

        print(
            "[PhoBERTScorer] semantic_score=",
            round(semantic_score, 2),
            "keyword_score=",
            round(keyword_score, 2),
            "length_score=",
            round(length_score, 2),
            "content_score=",
            round(content_score, 2),
            "fallback=",
            used_fallback,
        )

        return {
            "content_score": round(content_score, 2),
            "semantic_score": round(semantic_score, 2),
            "keyword_score": round(keyword_score, 2),
            "feedback": feedback,
        }

    def _normalize_text(self, text):
        text = (text or "").strip()
        if not text:
            return ""

        return word_tokenize(text, format="text")

    def _normalize_for_matching(self, text):
        text = (text or "").strip().lower()
        decomposed = unicodedata.normalize("NFD", text)
        without_marks = "".join(
            char for char in decomposed if unicodedata.category(char) != "Mn"
        )

        return without_marks.replace("đ", "d")

    def _compute_keyword_score(self, answer_text, keywords):
        if not keywords:
            return 100.0

        normalized_answer = self._normalize_for_matching(answer_text)
        matched_count = sum(
            1
            for keyword in keywords
            if keyword and self._normalize_for_matching(keyword) in normalized_answer
        )

        return (matched_count / len(keywords)) * 100

    def _compute_length_score(self, answer_text):
        word_count = self._count_words(answer_text)

        if word_count < 10:
            return 30.0
        if word_count <= 50:
            return 100.0
        return 80.0

    def _count_words(self, text):
        return len(word_tokenize(text or ""))

    def _compute_keyword_fallback_score(
        self,
        answer_text,
        sample_answer,
        keyword_score,
    ):
        sample_tokens = set(
            self._normalize_for_matching(sample_answer).replace("_", " ").split()
        )
        answer_tokens = set(
            self._normalize_for_matching(answer_text).replace("_", " ").split()
        )

        if not sample_tokens or not answer_tokens:
            return keyword_score

        overlap_score = (len(sample_tokens & answer_tokens) / len(sample_tokens)) * 100
        return max(keyword_score, overlap_score)

    def _build_feedback(self, semantic_score, keyword_score, length_score):
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
