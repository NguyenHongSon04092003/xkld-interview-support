from decimal import Decimal

from models.mock_interview_answer import MockInterviewAnswer
from models.mock_interview_session import MockInterviewSession


class FinalScorer:
    def __init__(self, content_scorer=None):
        self.content_scorer = content_scorer

    def calculate_final_score(self, session_id, db):
        session = (
            db.query(MockInterviewSession)
            .filter(MockInterviewSession.id == session_id)
            .first()
        )

        if session is None:
            raise ValueError("Mock interview session not found")

        raw_answers = (
            db.query(MockInterviewAnswer)
            .filter(MockInterviewAnswer.session_id == session_id)
            .order_by(MockInterviewAnswer.id.asc())
            .all()
        )
        answers = self._select_effective_answers(raw_answers)

        self._score_missing_content(answers, db)

        content_scores = [
            float(answer.content_score)
            for answer in answers
            if answer.content_score is not None
        ]
        avg_content_score = (
            sum(content_scores) / len(content_scores)
            if content_scores
            else 0.0
        )
        behavior_score = (
            float(session.behavior_score)
            if session.behavior_score is not None
            else 0.0
        )
        total_score = avg_content_score * 0.4 + behavior_score * 0.6
        final_feedback = self.generate_final_feedback(
            total_score,
            avg_content_score,
            behavior_score,
        )

        session.total_score = Decimal(str(round(total_score, 2)))
        session.content_score = Decimal(str(round(avg_content_score, 2)))
        session.final_feedback = final_feedback
        db.commit()
        db.refresh(session)

        return {
            "total_score": round(total_score, 2),
            "avg_content_score": round(avg_content_score, 2),
            "behavior_score": round(behavior_score, 2),
            "final_feedback": final_feedback,
            "answers_detail": self._build_answers_detail(answers),
        }

    def _score_missing_content(self, answers, db):
        if self.content_scorer is None:
            return

        for answer in answers:
            if answer.content_score is not None:
                continue

            result = self.content_scorer.score_answer(
                answer.question_id,
                answer.answer_text or "",
                db,
            )
            answer.content_score = Decimal(str(result["content_score"]))
            answer.feedback = result["feedback"]

        db.commit()

    def _select_effective_answers(self, answers):
        selected_by_question = {}

        for answer in answers:
            current = selected_by_question.get(answer.question_id)
            if current is None or self._is_better_answer(answer, current):
                selected_by_question[answer.question_id] = answer

        return sorted(selected_by_question.values(), key=lambda answer: answer.id)

    def _is_better_answer(self, candidate, current):
        candidate_has_text = bool((candidate.answer_text or "").strip())
        current_has_text = bool((current.answer_text or "").strip())

        if candidate_has_text != current_has_text:
            return candidate_has_text

        return candidate.id > current.id

    def generate_final_feedback(
        self,
        total_score,
        avg_content_score,
        behavior_score,
    ):
        feedback_parts = []

        if total_score >= 80:
            feedback_parts.append(
                "Xuat sac! Ban co kha nang cao vuot qua phong van"
            )
        elif total_score >= 60:
            feedback_parts.append(
                "Kha tot! Can cai thien them mot so diem"
            )
        elif total_score >= 40:
            feedback_parts.append("Trung binh. Can luyen tap them nhieu")
        else:
            feedback_parts.append(
                "Can co gang nhieu hon. Hay xem lai cac cau tra loi"
            )

        if avg_content_score < 50:
            feedback_parts.append("Noi dung cau tra loi can duoc cai thien")
        if behavior_score < 50:
            feedback_parts.append(
                "Can chu y tac phong va anh mat khi phong van"
            )

        return ". ".join(feedback_parts)

    def _build_answers_detail(self, answers):
        return [
            {
                "id": answer.id,
                "question_id": answer.question_id,
                "question_content": (
                    answer.question.question_content
                    if answer.question is not None
                    else None
                ),
                "answer_text": answer.answer_text,
                "content_score": (
                    float(answer.content_score)
                    if answer.content_score is not None
                    else None
                ),
                "behavior_score": (
                    float(answer.behavior_score)
                    if answer.behavior_score is not None
                    else None
                ),
                "feedback": answer.feedback,
            }
            for answer in answers
        ]
