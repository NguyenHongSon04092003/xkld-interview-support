import re
from decimal import Decimal

from database import SessionLocal
from models.job_order import JobOrder, JobOrderStatus


REAL_ORDERS = [
    {
        "job_name": "Thực tập sinh tiện NC tại Nhật Bản",
        "company_name": "Cty Cổ Phần TATEKITA",
        "status": "open",
        "job_position": "Thực tập sinh kỹ năng ngành gia công cơ khí",
        "salary": "191.388 yên/tháng, 1.167 yên/giờ",
        "location": "Nagano, Nhật Bản",
        "gender_requirement": "Nam",
        "education_level": "Tốt nghiệp THPT trở lên",
        "experience_required": "Không yêu cầu, ưu tiên ứng viên có kỹ năng tiện NC, CNC",
        "job_description": "Tiện NC trong ngành gia công cơ khí",
    },
    {
        "job_name": "Thực tập sinh vệ sinh tòa nhà, khách sạn tại Nhật Bản",
        "company_name": "Công ty cổ phần SKM",
        "status": "open",
        "job_position": "Thực tập sinh",
        "salary": "184.680 yên/tháng, 1.140 yên/giờ",
        "location": "Aichi, Nhật Bản",
        "gender_requirement": "Nữ",
        "education_level": "Tốt nghiệp Cao Đẳng trở lên",
        "experience_required": "Không yêu cầu",
        "job_description": "Vệ sinh tòa nhà, khách sạn tại Lego Land và tòa nhà Seiwa",
    },
    {
        "job_name": "Thực tập sinh chế biến thực phẩm tại Nhật Bản",
        "company_name": "Công ty TNHH KATAOKA",
        "status": "open",
        "job_position": "Thực tập sinh chế biến thực phẩm",
        "salary": "182.875 yên/tháng, 1.050 yên/giờ",
        "location": "Nigata, Nhật Bản",
        "gender_requirement": "Nữ",
        "education_level": "Tốt nghiệp THPT",
        "experience_required": "Không yêu cầu",
        "job_description": "Sản xuất cơm hộp, đồ ăn đóng gói",
    },
    {
        "job_name": "Thực tập sinh thợ mộc xây dựng tại Nhật Bản",
        "company_name": "Công ty Taisei Jyuken",
        "status": "open",
        "job_position": "Thực tập sinh ngành thợ mộc",
        "salary": "181.050 yên/tháng, 1.065 yên/giờ",
        "location": "Gifu, Nhật Bản",
        "gender_requirement": "Nam",
        "education_level": "Tốt nghiệp trung cấp trở lên",
        "experience_required": "Không yêu cầu, ưu tiên có kinh nghiệm",
        "job_description": "Làm móng nhà gỗ, công việc thợ mộc",
    },
    {
        "job_name": "Thực tập sinh chế biến thực phẩm tại Nhật Bản",
        "company_name": "PRIME DELICA",
        "status": "open",
        "job_position": "Thực tập sinh kỹ năng",
        "salary": "171.667 yên/tháng, 1.030 yên/giờ",
        "location": "Miyazaki, Nhật Bản",
        "gender_requirement": "Nữ",
        "education_level": "Tốt nghiệp THPT trở lên",
        "experience_required": "Không yêu cầu",
        "job_description": "Chế biến thực phẩm ăn kèm, có làm ca đêm",
    },
    {
        "job_name": "Thực tập sinh nghiệp vụ khách sạn tại Nhật Bản",
        "company_name": "NISEKO HANAZO HOTEL",
        "status": "open",
        "job_position": "Thực tập sinh khách sạn",
        "salary": "186.190 yên/tháng, 1.075 yên/giờ",
        "location": "Hokkaido, Nhật Bản",
        "gender_requirement": "Nữ",
        "education_level": "Tốt nghiệp THPT",
        "experience_required": "Có kiểm tra đầu vào",
        "job_description": "Nghiệp vụ khách sạn",
    },
    {
        "job_name": "Thực tập sinh thao tác máy đúc nhựa ô tô",
        "company_name": "Công ty cổ phần FUJI",
        "status": "open",
        "job_position": "Thực tập sinh kỹ năng",
        "salary": "185.000 yên/tháng, 1.140 yên/giờ",
        "location": "Aichi, Nhật Bản",
        "gender_requirement": "Nam",
        "education_level": "THPT trở lên",
        "experience_required": "Không yêu cầu",
        "job_description": "Vận hành máy đúc, kiểm tra linh kiện nhựa ô tô",
    },
    {
        "job_name": "Kỹ năng đặc định bảo dưỡng ô tô",
        "company_name": "Các đại lý ô tô Mitsubishi, Toyota",
        "status": "open",
        "job_position": "Bảo dưỡng ô tô",
        "salary": "210.000 ~ 240.000 yên/tháng, 1.250 yên/giờ",
        "location": "Toàn quốc, Nhật Bản",
        "gender_requirement": "Nam",
        "education_level": "Trung cấp trở lên",
        "experience_required": "Không yêu cầu",
        "job_description": "Bảo dưỡng, sửa chữa, kiểm tra xe định kỳ",
    },
    {
        "job_name": "Kỹ năng đặc định lái xe",
        "company_name": "Hiệp hội Vận tải Nhật Bản",
        "status": "open",
        "job_position": "Lái xe vận tải",
        "salary": "215.000 ~ 264.000 yên/tháng, 1.300 ~ 1.500 yên/giờ",
        "location": "Toàn quốc, Nhật Bản",
        "gender_requirement": "Nam",
        "education_level": "Tốt nghiệp THPT trở lên",
        "experience_required": "Không yêu cầu",
        "job_description": "Lái xe, vận chuyển và kiểm tra hàng hóa",
    },
]


def parse_salary(value):
    if not value:
        return None

    match = re.search(r"(\d[\d.]*)", value)
    if match is None:
        return None

    normalized = match.group(1).replace(".", "")
    return Decimal(normalized)


def build_payload(order_data):
    return {
        "job_name": order_data["job_name"],
        "company_name": order_data["company_name"],
        "status": JobOrderStatus(order_data.get("status", "open")),
        "job_position": order_data.get("job_position"),
        "salary": parse_salary(order_data.get("salary")),
        "location": order_data.get("location"),
        "quantity": order_data.get("quantity", 0),
        "age_min": order_data.get("age_min", 18),
        "age_max": order_data.get("age_max", 40),
        "gender_requirement": order_data.get("gender_requirement"),
        "education_level": order_data.get("education_level"),
        "experience_required": order_data.get("experience_required"),
        "job_description": order_data.get("job_description"),
        "interview_requirement": order_data.get(
            "interview_requirement",
            "Phỏng vấn trực tiếp tại văn phòng",
        ),
    }


def seed_real_orders():
    db = SessionLocal()
    created_count = 0

    try:
        for order_data in REAL_ORDERS:
            existing_order = (
                db.query(JobOrder)
                .filter(
                    JobOrder.job_name == order_data["job_name"],
                    JobOrder.company_name == order_data["company_name"],
                )
                .first()
            )

            if existing_order is not None:
                continue

            db.add(JobOrder(**build_payload(order_data)))
            created_count += 1

        db.commit()
        return created_count
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    created = seed_real_orders()
    print(f"Added {created} real job orders")
