import statistics

from models.mock_interview_answer import MockInterviewAnswer
from models.mock_interview_session import MockInterviewSession


class BehaviorScorer:
    def score_session(self, session_id, db):
        session = (
            db.query(MockInterviewSession)
            .filter(MockInterviewSession.id == session_id)
            .first()
        )

        if session is None:
            raise ValueError("Mock interview session not found")

        answers = (
            db.query(MockInterviewAnswer)
            .filter(
                MockInterviewAnswer.session_id == session_id,
                MockInterviewAnswer.behavior_score.isnot(None),
            )
            .all()
        )

        if not answers:
            avg_behavior_score = 0.0
            consistency_score = 40.0
        else:
            scores = [float(answer.behavior_score) for answer in answers]
            avg_behavior_score = sum(scores) / len(scores)
            consistency_score = self._compute_consistency_score(scores)

        final_behavior_score = (
            avg_behavior_score * 0.7 + consistency_score * 0.3
        )
        feedback = self.generate_feedback(avg_behavior_score, consistency_score)

        return {
            "final_behavior_score": round(final_behavior_score, 2),
            "avg_behavior_score": round(avg_behavior_score, 2),
            "consistency_score": round(consistency_score, 2),
            "feedback": feedback,
        }

    def generate_feedback(self, avg_score, consistency_score):
        feedback_parts = []

        if avg_score > 80:
            feedback_parts.append("Tac phong tot, duy tri tot anh mat")
        elif avg_score >= 60:
            feedback_parts.append("Tac phong kha, can nhin camera nhieu hon")
        else:
            feedback_parts.append(
                "Tac phong can cai thien, thuong xuyen roi khung hinh"
            )

        if consistency_score < 60:
            feedback_parts.append("Tac phong khong dong deu giua cac cau")

        return ". ".join(feedback_parts)

    def _compute_consistency_score(self, scores):
        if len(scores) <= 1:
            return 100.0

        standard_deviation = statistics.pstdev(scores)

        if standard_deviation < 10:
            return 100.0
        if standard_deviation <= 20:
            return 70.0
        return 40.0
