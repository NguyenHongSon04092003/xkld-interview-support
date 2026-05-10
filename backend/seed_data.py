import os
import secrets
import string
from decimal import Decimal

from auth import hash_password
from database import SessionLocal
from models.interview_question import InterviewQuestion
from models.job_order import JobOrder, JobOrderStatus
from models.question_keyword import QuestionKeyword
from models.user import User, UserRole


def generate_password(length=18):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


USERS = [
    {
        "email": "admin@xkld.com",
        "password": os.getenv("SEED_ADMIN_PASSWORD") or generate_password(),
        "role": UserRole.admin,
        "full_name": "Quản trị viên",
        "phone": "0900000001",
    },
    {
        "email": "consultant@xkld.com",
        "password": os.getenv("SEED_CONSULTANT_PASSWORD") or generate_password(),
        "role": UserRole.consultant,
        "full_name": "Nguyễn Tư Vấn",
        "phone": "0900000002",
    },
    {
        "email": "candidate@xkld.com",
        "password": os.getenv("SEED_CANDIDATE_PASSWORD") or generate_password(),
        "role": UserRole.candidate,
        "full_name": "Trần Ứng Viên",
        "phone": "0900000003",
    },
]


JOB_ORDERS = [
    {
        "job_name": "Kỹ sư xây dựng Nhật Bản",
        "company_name": "Công ty Taisei Corporation",
        "status": JobOrderStatus.open,
        "job_position": "Kỹ sư xây dựng",
        "salary": Decimal("40000000"),
        "location": "Tokyo, Nhật Bản",
        "quantity": 10,
        "age_min": 20,
        "age_max": 35,
        "gender_requirement": "Nam",
        "education_level": "Cao đẳng trở lên",
        "experience_required": "1 năm",
        "job_description": (
            "Làm việc tại công trình xây dựng dân dụng và công nghiệp tại Nhật Bản"
        ),
        "interview_requirement": "Phỏng vấn tiếng Nhật N4 cơ bản",
    },
    {
        "job_name": "Điều dưỡng viên Đức",
        "company_name": "Bệnh viện Munich Care GmbH",
        "status": JobOrderStatus.open,
        "job_position": "Điều dưỡng viên",
        "salary": Decimal("55000000"),
        "location": "Munich, Đức",
        "quantity": 5,
        "age_min": 22,
        "age_max": 40,
        "gender_requirement": "Không yêu cầu",
        "education_level": "Đại học",
        "experience_required": "2 năm",
        "job_description": "Chăm sóc bệnh nhân tại bệnh viện lớn ở Munich",
        "interview_requirement": "Phỏng vấn tiếng Đức A2 và chuyên môn y tế",
    },
    {
        "job_name": "Công nhân chế biến thực phẩm Hàn Quốc",
        "company_name": "CJ CheilJedang Factory",
        "status": JobOrderStatus.open,
        "job_position": "Công nhân sản xuất",
        "salary": Decimal("30000000"),
        "location": "Seoul, Hàn Quốc",
        "quantity": 20,
        "age_min": 18,
        "age_max": 38,
        "gender_requirement": "Không yêu cầu",
        "education_level": "THPT",
        "experience_required": "Không yêu cầu",
        "job_description": "Làm việc trong nhà máy chế biến thực phẩm tại Hàn Quốc",
        "interview_requirement": "Phỏng vấn tiếng Hàn cơ bản và sức khỏe tốt",
    },
]


QUESTIONS_BY_JOB = {
    "Kỹ sư xây dựng Nhật Bản": [
        {
            "question_content": (
                "Bạn có kinh nghiệm làm việc trong lĩnh vực xây dựng không? "
                "Hãy mô tả công việc bạn đã làm."
            ),
            "sample_answer": (
                "Tôi có X năm kinh nghiệm trong lĩnh vực xây dựng, đã từng làm việc tại..."
            ),
            "keywords": ["kinh nghiệm", "xây dựng", "công trình", "năm"],
        },
        {
            "question_content": "Tại sao bạn muốn đi làm việc tại Nhật Bản?",
            "sample_answer": (
                "Tôi muốn đi Nhật Bản vì môi trường làm việc chuyên nghiệp, mức lương tốt..."
            ),
            "keywords": ["Nhật Bản", "môi trường", "chuyên nghiệp", "lương", "phát triển"],
        },
        {
            "question_content": (
                "Bạn có thể làm việc trong điều kiện thời tiết khắc nghiệt không?"
            ),
            "sample_answer": "Tôi có thể thích nghi với mọi điều kiện thời tiết vì...",
            "keywords": ["thích nghi", "thời tiết", "sức khỏe", "làm việc"],
        },
        {
            "question_content": "Bạn biết những gì về văn hóa làm việc của người Nhật?",
            "sample_answer": (
                "Người Nhật rất coi trọng kỷ luật, đúng giờ và chất lượng công việc..."
            ),
            "keywords": ["kỷ luật", "đúng giờ", "chất lượng", "văn hóa", "tôn trọng"],
        },
        {
            "question_content": "Kế hoạch của bạn sau khi hoàn thành hợp đồng là gì?",
            "sample_answer": "Sau khi hoàn thành hợp đồng tôi dự định...",
            "keywords": ["kế hoạch", "hợp đồng", "tương lai", "tiết kiệm", "kinh nghiệm"],
        },
    ],
    "Điều dưỡng viên Đức": [
        {
            "question_content": "Bạn có bằng điều dưỡng không? Trường nào cấp?",
            "sample_answer": "Tôi tốt nghiệp khoa Điều dưỡng trường...",
            "keywords": ["bằng", "điều dưỡng", "tốt nghiệp", "trường"],
        },
        {
            "question_content": "Bạn đã từng chăm sóc bệnh nhân cao tuổi chưa?",
            "sample_answer": (
                "Tôi đã có kinh nghiệm chăm sóc bệnh nhân cao tuổi tại..."
            ),
            "keywords": ["bệnh nhân", "cao tuổi", "chăm sóc", "kinh nghiệm"],
        },
        {
            "question_content": "Tại sao bạn chọn nghề điều dưỡng?",
            "sample_answer": "Tôi chọn nghề điều dưỡng vì muốn giúp đỡ người bệnh...",
            "keywords": ["điều dưỡng", "giúp đỡ", "người bệnh", "đam mê"],
        },
        {
            "question_content": "Bạn xử lý như thế nào khi bệnh nhân không hợp tác?",
            "sample_answer": "Tôi sẽ kiên nhẫn lắng nghe và tìm cách giải thích...",
            "keywords": ["kiên nhẫn", "lắng nghe", "giải thích", "xử lý"],
        },
        {
            "question_content": "Bạn có thể làm ca đêm không?",
            "sample_answer": "Tôi có thể làm ca đêm vì sức khỏe tốt và...",
            "keywords": ["ca đêm", "sức khỏe", "linh hoạt", "sẵn sàng"],
        },
    ],
    "Công nhân chế biến thực phẩm Hàn Quốc": [
        {
            "question_content": (
                "Bạn có sẵn sàng làm việc trong môi trường nhà máy không?"
            ),
            "sample_answer": "Tôi sẵn sàng làm việc trong môi trường nhà máy vì...",
            "keywords": ["nhà máy", "sẵn sàng", "môi trường", "làm việc"],
        },
        {
            "question_content": "Bạn có kinh nghiệm làm việc theo ca không?",
            "sample_answer": "Tôi đã từng làm việc theo ca tại...",
            "keywords": ["ca", "kinh nghiệm", "linh hoạt", "thời gian"],
        },
        {
            "question_content": "Tại sao bạn muốn đi Hàn Quốc làm việc?",
            "sample_answer": "Tôi muốn đi Hàn Quốc vì mức lương tốt và cơ hội...",
            "keywords": ["Hàn Quốc", "lương", "cơ hội", "tương lai"],
        },
        {
            "question_content": "Bạn có thể xa nhà trong thời gian dài không?",
            "sample_answer": "Tôi có thể xa nhà vì đã chuẩn bị tâm lý...",
            "keywords": ["xa nhà", "tâm lý", "gia đình", "chấp nhận"],
        },
        {
            "question_content": "Sức khỏe của bạn hiện tại như thế nào?",
            "sample_answer": "Sức khỏe tôi tốt, không có bệnh nền...",
            "keywords": ["sức khỏe", "tốt", "bệnh", "thể lực"],
        },
    ],
}


def get_or_create_user(db, user_data):
    user = db.query(User).filter(User.email == user_data["email"]).first()
    if user:
        return user, False

    user = User(
        full_name=user_data["full_name"],
        email=user_data["email"],
        password=hash_password(user_data["password"]),
        role=user_data["role"],
        phone=user_data["phone"],
    )
    db.add(user)
    db.flush()
    return user, True


def get_or_create_job_order(db, job_data):
    job_order = (
        db.query(JobOrder)
        .filter(JobOrder.job_name == job_data["job_name"])
        .first()
    )
    if job_order:
        return job_order, False

    job_order = JobOrder(**job_data)
    db.add(job_order)
    db.flush()
    return job_order, True


def get_or_create_question(db, job_order, question_data, display_order):
    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.job_order_id == job_order.id,
            InterviewQuestion.question_content == question_data["question_content"],
        )
        .first()
    )
    if question:
        return question, False

    question = InterviewQuestion(
        job_order_id=job_order.id,
        question_content=question_data["question_content"],
        sample_answer=question_data["sample_answer"],
        difficulty_level="medium",
        score_weight=Decimal("20"),
        display_order=display_order,
    )
    db.add(question)
    db.flush()
    return question, True


def ensure_keywords(db, question, keywords):
    created_count = 0

    for keyword in keywords:
        existing = (
            db.query(QuestionKeyword)
            .filter(
                QuestionKeyword.question_id == question.id,
                QuestionKeyword.keyword == keyword,
            )
            .first()
        )
        if existing:
            continue

        db.add(QuestionKeyword(question_id=question.id, keyword=keyword))
        created_count += 1

    return created_count


def seed_database():
    db = SessionLocal()
    summary = {
        "users": 0,
        "job_orders": 0,
        "questions": 0,
        "keywords": 0,
        "seed_users": USERS,
    }

    try:
        for user_data in USERS:
            _, created = get_or_create_user(db, user_data)
            summary["users"] += int(created)

        job_orders = {}
        for job_data in JOB_ORDERS:
            job_order, created = get_or_create_job_order(db, job_data)
            job_orders[job_order.job_name] = job_order
            summary["job_orders"] += int(created)

        for job_name, questions in QUESTIONS_BY_JOB.items():
            job_order = job_orders[job_name]
            for index, question_data in enumerate(questions, start=1):
                question, created = get_or_create_question(
                    db,
                    job_order,
                    question_data,
                    index,
                )
                summary["questions"] += int(created)
                summary["keywords"] += ensure_keywords(
                    db,
                    question,
                    question_data["keywords"],
                )

        db.commit()
        return summary
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    result = seed_database()
    print("Seed data completed")
    print(f"Users created: {result['users']}")
    print(f"Job orders created: {result['job_orders']}")
    print(f"Questions created: {result['questions']}")
    print(f"Keywords created: {result['keywords']}")
    if result["users"]:
        print("Generated seed account credentials:")
        for user_data in result["seed_users"]:
            print(f"{user_data['role'].value}: {user_data['email']} / {user_data['password']}")
