# -*- coding: utf-8 -*-

from decimal import Decimal

from database import SessionLocal
from models.interview_question import InterviewQuestion
from models.job_order import JobOrder
from models.question_keyword import QuestionKeyword


questions = [
    ("Điểm mạnh, điểm yếu của bạn là gì?", "Tôi là người chăm chỉ, đúng giờ và chịu khó học hỏi. Điểm yếu của tôi là đôi lúc hơi cầu toàn, nhưng tôi đang cải thiện để làm việc nhanh và hiệu quả hơn.", ["chăm chỉ", "đúng giờ", "học hỏi", "cầu toàn", "cải thiện"], "easy", 2),
    ("Hãy PR bản thân bạn trong 30 giây.", "Tôi là người có trách nhiệm, sức khỏe tốt và thích nghi nhanh. Tôi luôn cố gắng hoàn thành công việc đúng thời gian và muốn học hỏi nhiều kinh nghiệm tại Nhật Bản.", ["trách nhiệm", "sức khỏe", "thích nghi", "hoàn thành", "kinh nghiệm"], "easy", 2),
    ("Nếu công ty tuyển bạn, bạn sẽ cống hiến gì cho công ty?", "Nếu được tuyển, tôi sẽ làm việc nghiêm túc, tuân thủ nội quy và cố gắng hoàn thành công việc tốt nhất để đóng góp cho công ty.", ["nghiêm túc", "nội quy", "hoàn thành", "đóng góp", "cống hiến"], "medium", 2),
    ("Gia đình bạn có đồng ý cho bạn đi Nhật không?", "Dạ có. Gia đình rất ủng hộ vì muốn tôi có cơ hội phát triển và học hỏi ở môi trường tốt hơn.", ["gia đình", "ủng hộ", "phát triển", "học hỏi", "môi trường"], "easy", 1),
    ("Ước mơ của bạn trong tương lai là gì?", "Tôi muốn có công việc ổn định, tích lũy kinh nghiệm và sau này có thể phát triển sự nghiệp riêng tại Việt Nam.", ["ổn định", "tích lũy", "kinh nghiệm", "phát triển", "sự nghiệp"], "easy", 1),
    ("Sau 3 năm làm việc bạn muốn kiếm được bao nhiêu tiền? Số tiền đó dùng làm gì?", "Tôi muốn tích lũy được một khoản vốn ổn định để phụ giúp gia đình và phát triển công việc sau khi về nước.", ["tích lũy", "vốn", "gia đình", "phát triển", "về nước"], "medium", 2),
    ("Sau khi về nước bạn dự định sẽ làm công việc gì?", "Sau khi về nước tôi muốn làm công việc liên quan đến ngành đã học và áp dụng kinh nghiệm từ Nhật.", ["về nước", "ngành nghề", "kinh nghiệm", "áp dụng", "phát triển"], "medium", 2),
    ("Bạn biết gì về Nhật Bản?", "Tôi biết Nhật Bản là đất nước nổi tiếng về kỷ luật, đúng giờ, công nghệ hiện đại và con người rất chăm chỉ.", ["kỷ luật", "đúng giờ", "công nghệ", "chăm chỉ", "văn hóa"], "easy", 1),
    ("Bạn có khó khăn gì khi học tiếng Nhật không?", "Lúc đầu tôi thấy khó nhớ từ vựng và chữ Kanji, nhưng tôi cố gắng học mỗi ngày nên đã tiến bộ hơn.", ["từ vựng", "Kanji", "học mỗi ngày", "tiến bộ", "cố gắng"], "easy", 1),
    ("Nếu lần này không đậu bạn sẽ làm gì?", "Nếu chưa đậu tôi sẽ tiếp tục học tiếng Nhật, cải thiện kỹ năng và cố gắng ở lần tiếp theo.", ["tiếp tục", "học tiếng Nhật", "cải thiện", "cố gắng", "lần tiếp theo"], "medium", 2),
    ("Bạn có tự tin về thể lực của mình không?", "Dạ có. Tôi thường xuyên vận động và tự tin có thể đáp ứng công việc.", ["thể lực", "vận động", "tự tin", "sức khỏe", "đáp ứng"], "easy", 1),
    ("Bạn có bệnh nền hay bệnh di truyền gì không?", "Tôi không có bệnh nền hay bệnh di truyền nghiêm trọng.", ["bệnh nền", "di truyền", "sức khỏe", "không bệnh"], "easy", 1),
    ("Bạn có bạn bè hoặc người thân ở Nhật không?", "Tôi có một vài người quen ở Nhật nhưng tôi muốn tự lập và tập trung làm việc.", ["tự lập", "tập trung", "làm việc", "người thân"], "easy", 1),
    ("Ngoài công việc bạn muốn làm gì ở Nhật?", "Tôi muốn tìm hiểu văn hóa, học thêm tiếng Nhật và khám phá cuộc sống tại Nhật.", ["văn hóa", "tiếng Nhật", "khám phá", "cuộc sống"], "easy", 1),
    ("Tại sao bạn chọn đi Nhật mà không phải nước khác?", "Vì Nhật Bản có môi trường làm việc chuyên nghiệp, an toàn và giúp tôi học hỏi được nhiều kỹ năng.", ["chuyên nghiệp", "an toàn", "kỹ năng", "môi trường", "học hỏi"], "medium", 2),
    ("Thất bại lớn nhất của bạn là gì?", "Trước đây tôi từng thiếu tự tin khi giao tiếp, nhưng sau đó tôi luyện tập nhiều hơn và cải thiện được.", ["tự tin", "giao tiếp", "luyện tập", "cải thiện", "khắc phục"], "medium", 2),
    ("Người bạn quý trọng nhất là ai?", "Người tôi quý trọng nhất là bố mẹ vì luôn ủng hộ và động viên tôi.", ["bố mẹ", "ủng hộ", "động viên", "gia đình"], "easy", 1),
    ("Công việc hiện tại của bạn là gì?", "Hiện tại tôi đang làm công việc liên quan đến sản xuất hoặc dịch vụ và học thêm tiếng Nhật.", ["công việc", "sản xuất", "dịch vụ", "tiếng Nhật"], "easy", 1),
    ("Bạn có người yêu chưa?", "Hiện tại tôi muốn tập trung cho công việc và tương lai nên ưu tiên phát triển bản thân.", ["tập trung", "công việc", "tương lai", "phát triển bản thân"], "easy", 1),
    ("Khi có khó khăn bạn thường chia sẻ với ai?", "Khi gặp khó khăn tôi thường chia sẻ với gia đình hoặc những người có kinh nghiệm.", ["chia sẻ", "gia đình", "kinh nghiệm", "khó khăn"], "easy", 1),
    ("Bạn muốn đạt trình độ tiếng Nhật nào?", "Tôi muốn đạt trình độ N3 hoặc cao hơn để giao tiếp và làm việc tốt hơn.", ["N3", "N2", "tiếng Nhật", "giao tiếp", "trình độ"], "easy", 1),
    ("Bạn đã từng làm ca đêm chưa?", "Tôi từng làm tăng ca nên có thể thích nghi với ca đêm nếu công ty yêu cầu.", ["ca đêm", "tăng ca", "thích nghi", "yêu cầu"], "easy", 1),
    ("Nỗi nhớ gia đình khi sang Nhật bạn sẽ vượt qua thế nào?", "Tôi sẽ gọi điện cho gia đình, tập trung học tập và làm việc để thích nghi với cuộc sống mới.", ["gọi điện", "gia đình", "tập trung", "thích nghi", "cuộc sống mới"], "medium", 2),
    ("Trong công việc điều gì quan trọng nhất?", "Theo tôi điều quan trọng nhất là trách nhiệm và tinh thần teamwork.", ["trách nhiệm", "teamwork", "quan trọng", "tinh thần"], "medium", 2),
    ("Nếu làm xong việc sớm bạn sẽ làm gì?", "Nếu làm xong sớm tôi sẽ hỗ trợ đồng nghiệp hoặc kiểm tra lại công việc.", ["hỗ trợ", "đồng nghiệp", "kiểm tra", "chủ động"], "easy", 1),
    ("Bạn có sẵn sàng làm đúng vị trí công ty sắp xếp không?", "Dạ có. Tôi sẵn sàng làm theo sự sắp xếp của công ty.", ["sẵn sàng", "vị trí", "sắp xếp", "tuân thủ"], "easy", 1),
    ("Mục đích đi Nhật của bạn là gì?", "Mục đích của tôi là học hỏi kinh nghiệm, nâng cao kỹ năng và tích lũy tài chính.", ["học hỏi", "kinh nghiệm", "kỹ năng", "tích lũy", "tài chính"], "medium", 2),
    ("Sống tập thể điều gì nên làm và không nên làm?", "Khi sống tập thể cần tôn trọng người khác, giữ vệ sinh và đúng giờ. Không nên làm ảnh hưởng mọi người.", ["tôn trọng", "vệ sinh", "đúng giờ", "tập thể", "ảnh hưởng"], "medium", 2),
    ("Nếu xảy ra mâu thuẫn bạn giải quyết thế nào?", "Tôi sẽ bình tĩnh lắng nghe, trao đổi rõ ràng và tìm cách giải quyết hợp lý.", ["bình tĩnh", "lắng nghe", "trao đổi", "giải quyết", "hợp lý"], "medium", 2),
    ("Nếu làm việc trong môi trường khắc nghiệt bạn chịu được không?", "Dạ được. Tôi nghĩ môi trường nào cũng cần sự cố gắng và tinh thần chịu khó.", ["môi trường", "khắc nghiệt", "cố gắng", "chịu khó", "tinh thần"], "medium", 2),
    ("Bạn biết gì về chương trình thực tập sinh kỹ năng?", "Tôi biết đây là chương trình giúp thực tập sinh học kỹ năng nghề nghiệp, tiếng Nhật và văn hóa làm việc.", ["thực tập sinh", "kỹ năng", "tiếng Nhật", "văn hóa", "chương trình"], "medium", 2),
    ("Tiếng Nhật quan trọng thế nào với công việc và cuộc sống?", "Tiếng Nhật giúp tôi giao tiếp tốt hơn, làm việc hiệu quả và hiểu văn hóa Nhật.", ["tiếng Nhật", "giao tiếp", "hiệu quả", "văn hóa", "quan trọng"], "medium", 2),
    ("Nếu sang Nhật bạn sẽ làm theo hướng dẫn của senpai hay làm theo ý mình?", "Tôi sẽ ưu tiên làm theo hướng dẫn của senpai để học hỏi kinh nghiệm và làm việc đúng quy trình.", ["senpai", "hướng dẫn", "quy trình", "học hỏi", "ưu tiên"], "medium", 2),
    ("Nếu có vấn đề phát sinh bạn sẽ làm gì?", "Tôi sẽ báo cáo với quản lý hoặc senpai và tìm cách xử lý nhanh nhất.", ["báo cáo", "quản lý", "senpai", "xử lý", "nhanh"], "medium", 2),
    ("Trong công việc và cuộc sống bạn ghét điều gì nhất?", "Tôi ghét sự thiếu trung thực và thiếu trách nhiệm.", ["trung thực", "trách nhiệm", "ghét", "thiếu"], "easy", 1),
    ("Làm thế nào để công ty tin tưởng và chọn bạn?", "Tôi nghĩ sự chăm chỉ, trung thực và thái độ nghiêm túc sẽ giúp công ty tin tưởng tôi.", ["chăm chỉ", "trung thực", "nghiêm túc", "tin tưởng", "thái độ"], "hard", 3),
    ("Bạn đã từng học tiếng Nhật chưa?", "Dạ rồi. Hiện tôi đang học giao tiếp và từ vựng cơ bản.", ["tiếng Nhật", "học", "giao tiếp", "từ vựng"], "easy", 1),
    ("Bạn đã áp dụng gì vào công việc?", "Tôi đã áp dụng tính kỷ luật, làm việc đúng giờ và tinh thần trách nhiệm vào công việc.", ["kỷ luật", "đúng giờ", "trách nhiệm", "áp dụng"], "medium", 2),
    ("Sở thích của bạn là gì?", "Sở thích của tôi là nghe nhạc, học tiếng Nhật và chơi thể thao.", ["sở thích", "thể thao", "tiếng Nhật", "học"], "easy", 1),
    ("Tại sao bạn chọn ngành này?", "Vì tôi thấy ngành này phù hợp với tính cách và tôi muốn phát triển lâu dài.", ["phù hợp", "tính cách", "phát triển", "lâu dài", "ngành"], "medium", 2),
    ("Ngày nghỉ bạn thường làm gì?", "Ngày nghỉ tôi thường nghỉ ngơi, học tiếng Nhật và phụ giúp gia đình.", ["nghỉ ngơi", "tiếng Nhật", "gia đình", "học"], "easy", 1),
    ("Bạn có nghĩ mình là người may mắn không?", "Tôi nghĩ mình may mắn vì luôn có gia đình hỗ trợ và có cơ hội phát triển bản thân.", ["may mắn", "gia đình", "hỗ trợ", "cơ hội", "phát triển"], "easy", 1),
    ("Bạn có bạn bè hoặc người thân ở Nhật không?", "Tôi có một vài người quen ở Nhật nhưng tôi muốn tự lập và tập trung làm việc.", ["tự lập", "tập trung", "làm việc", "người thân"], "easy", 1),
    ("Mới sang Nhật thời gian rảnh bạn muốn làm gì?", "Tôi muốn tìm hiểu khu vực sống, học thêm tiếng Nhật và làm quen môi trường mới.", ["tìm hiểu", "tiếng Nhật", "làm quen", "môi trường mới"], "easy", 1),
    ("Bạn biết gì về đất nước và ẩm thực Nhật Bản?", "Tôi biết Nhật nổi tiếng với sushi, ramen, tàu điện đúng giờ và văn hóa rất lịch sự.", ["sushi", "ramen", "văn hóa", "lịch sự", "đúng giờ"], "easy", 1),
    ("Vì sao bạn muốn đi Nhật rồi về mở cửa hàng riêng?", "Tôi muốn học hỏi kinh nghiệm quản lý và cách làm việc chuyên nghiệp để sau này phát triển công việc riêng.", ["kinh nghiệm", "quản lý", "chuyên nghiệp", "phát triển", "riêng"], "medium", 2),
    ("Trong công việc vị trí cao nhất của bạn là gì?", "Trong công việc tôi từng làm tổ trưởng hoặc nhân viên chính hỗ trợ đồng nghiệp.", ["tổ trưởng", "nhân viên", "hỗ trợ", "đồng nghiệp", "vị trí"], "medium", 2),
    ("Thần tượng của bạn là ai?", "Người tôi thần tượng là những người chăm chỉ và có trách nhiệm trong công việc.", ["thần tượng", "chăm chỉ", "trách nhiệm", "công việc"], "easy", 1),
    ("Bạn muốn học tiếng Nhật đến trình độ nào?", "Tôi muốn cố gắng đạt N2 trong tương lai.", ["N2", "tiếng Nhật", "trình độ", "tương lai", "cố gắng"], "easy", 1),
    ("Nếu gia đình có bệnh nền bạn có lo lắng khi đi Nhật không?", "Tôi có lo lắng nhưng gia đình vẫn ổn định nên tôi sẽ yên tâm làm việc và liên lạc thường xuyên.", ["lo lắng", "gia đình", "ổn định", "yên tâm", "liên lạc"], "medium", 2),
    ("Bạn đã học xong chưa?", "Dạ tôi đã hoàn thành chương trình học hoặc công việc hiện tại.", ["hoàn thành", "học", "chương trình", "công việc"], "easy", 1),
    ("Vì sao bạn muốn đi Nhật?", "Tôi muốn trải nghiệm môi trường chuyên nghiệp và phát triển bản thân tại Nhật.", ["trải nghiệm", "chuyên nghiệp", "phát triển", "bản thân", "Nhật"], "medium", 2),
    ("Sau khi về nước bạn sẽ làm gì?", "Sau khi về nước tôi muốn có công việc ổn định hoặc kinh doanh nhỏ liên quan ngành nghề đã học.", ["về nước", "ổn định", "kinh doanh", "ngành nghề", "học"], "medium", 2),
]


def job_has_questions(db, job_order_id):
    return (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.job_order_id == job_order_id)
        .first()
        is not None
    )


def add_question_keywords(db, question_id, keywords):
    for keyword in keywords:
        existing_keyword = (
            db.query(QuestionKeyword)
            .filter(
                QuestionKeyword.question_id == question_id,
                QuestionKeyword.keyword == keyword,
            )
            .first()
        )
        if existing_keyword:
            continue
        db.add(QuestionKeyword(question_id=question_id, keyword=keyword))


def seed_interview_questions():
    db = SessionLocal()
    total_created = 0

    try:
        job_orders = db.query(JobOrder).order_by(JobOrder.id).all()

        for job_order in job_orders:
            if job_has_questions(db, job_order.id):
                print(f"Bỏ qua đơn hàng đã có câu hỏi: {job_order.job_name}")
                continue

            created_for_job = 0
            for display_order, question in enumerate(questions, start=1):
                content, sample_answer, keywords, difficulty_level, score_weight = question
                interview_question = InterviewQuestion(
                    job_order_id=job_order.id,
                    question_content=content,
                    sample_answer=sample_answer,
                    difficulty_level=difficulty_level,
                    score_weight=Decimal(str(score_weight)),
                    display_order=display_order,
                )
                db.add(interview_question)
                db.flush()

                add_question_keywords(db, interview_question.id, keywords)
                created_for_job += 1

            db.commit()
            total_created += created_for_job
            print(f"Đã nhập {created_for_job} câu hỏi cho đơn hàng: {job_order.job_name}")

        print(f"Tổng: {total_created} câu hỏi đã nhập thành công")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_interview_questions()
