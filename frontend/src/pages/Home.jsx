import { Link } from "react-router-dom"

import heroImage from "../assets/hero.png"

const features = [
  {
    title: "Tìm đơn hàng phù hợp",
    description: "Lọc theo vị trí, mức lương, địa điểm và trạng thái tuyển dụng.",
  },
  {
    title: "Ôn luyện có định hướng",
    description: "Xem câu hỏi mẫu, đáp án gợi ý và từ khóa quan trọng trước buổi phỏng vấn.",
  },
  {
    title: "Phỏng vấn thử",
    description: "Ghi nhận câu trả lời, tác phong camera và tổng hợp điểm sau mỗi phiên.",
  },
]

const stats = [
  ["9", "đơn hàng thật"],
  ["53", "câu hỏi phỏng vấn"],
  ["40/60", "nội dung và tác phong"],
]

export default function Home() {
  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-lg bg-[#064E3B] text-white shadow-xl">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B] via-[#064E3B]/95 to-[#059669]/72" />

        <div className="relative grid min-h-[430px] items-center gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F28C28]">
              Hải Phong Group
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
              Nền tảng luyện phỏng vấn xuất khẩu lao động
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">
              Hỗ trợ ứng viên chọn đơn hàng, ôn câu hỏi và thực hành phỏng vấn thử
              bằng giọng nói, webcam và hệ thống chấm điểm tự động.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/jobs" className="hp-btn-primary bg-[#F28C28] px-5 py-3 hover:bg-[#d87312]">
                Xem đơn hàng
              </Link>
              <Link to="/recommendation" className="rounded-md border border-white/35 bg-white/10 px-5 py-3 font-bold text-white hover:bg-white/18">
                Gợi ý đơn hàng
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-md bg-white p-4 text-[#064E3B]">
                <p className="text-3xl font-black">{value}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {features.map((feature, index) => (
          <article key={feature.title} className="hp-panel p-6">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[#ECFDF5] text-sm font-black text-[#059669]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-4 text-xl font-black text-[#064E3B]">{feature.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
          </article>
        ))}
      </div>

      <div className="hp-panel grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="hp-eyebrow">Quy trình</p>
          <h2 className="mt-2 text-2xl font-black text-[#064E3B]">
            Từ chọn đơn đến xem kết quả trong một luồng rõ ràng
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Chọn đơn hàng", "Ôn luyện câu hỏi", "Phỏng vấn thử"].map((step) => (
            <div key={step} className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-4 font-bold text-[#064E3B]">
              {step}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


