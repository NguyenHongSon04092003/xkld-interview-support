import { useState } from "react"
import { Link } from "react-router-dom"

import api from "../services/api.js"

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value))
}

function formatSalary(jobOrder) {
  const salaryMin = jobOrder.salary_min ?? jobOrder.salary
  const salaryMax = jobOrder.salary_max

  if (salaryMin !== null && salaryMin !== undefined && salaryMin !== "") {
    if (salaryMax !== null && salaryMax !== undefined && salaryMax !== "") {
      return `${formatMoney(salaryMin)} - ${formatMoney(salaryMax)}`
    }

    return formatMoney(salaryMin)
  }

  if (jobOrder.salary === null || jobOrder.salary === undefined || jobOrder.salary === "") {
    return "Thỏa thuận"
  }

  return formatMoney(jobOrder.salary)
}

export default function Recommendation() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "female",
    education_level: "THPT",
    experience_years: "",
    desired_job: "",
  })
  const [recommendations, setRecommendations] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage("")

    if (
      formData.age === "" ||
      formData.experience_years === "" ||
      !formData.desired_job.trim()
    ) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const age = Number(formData.age)
    const experienceYears = Number(formData.experience_years)

    if (!Number.isFinite(age) || age < 18) {
      setErrorMessage("Tuổi phải lớn hơn hoặc bằng 18")
      return
    }

    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      setErrorMessage("Số năm kinh nghiệm tối thiểu là 0")
      return
    }

    try {
      setIsLoading(true)
      setHasSearched(true)
      const payload = {
        age,
        gender: formData.gender,
        education_level: formData.education_level,
        experience_years: experienceYears,
        desired_job: formData.desired_job,
      }
      const response = await api.post("/recommendations", payload)
      setRecommendations(response.data)
    } catch {
      setErrorMessage("Không thể tìm đơn hàng phù hợp")
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="hp-page-heading">
        <p className="hp-eyebrow">Gợi ý đơn hàng</p>
        <h1 className="hp-title">Tìm đơn hàng phù hợp với hồ sơ</h1>
        <p className="hp-subtitle">
          Nhập nhanh thông tin ứng viên để hệ thống đề xuất các đơn hàng có khả năng
          phù hợp nhất.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="hp-panel grid gap-4 p-5 md:grid-cols-2"
      >
        <Input
          label="Tuổi"
          name="age"
          type="number"
          min="18"
          value={formData.age}
          onChange={handleChange}
        />

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-800">Giới tính</span>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="hp-input"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="any">Không yêu cầu</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-800">
            Trình độ học vấn
          </span>
          <select
            name="education_level"
            value={formData.education_level}
            onChange={handleChange}
            className="hp-input"
          >
            <option value="THPT">THPT</option>
            <option value="Trung cấp">Trung cấp</option>
            <option value="Cao đẳng">Cao đẳng</option>
            <option value="Đại học">Đại học</option>
          </select>
        </label>

        <Input
          label="Số năm kinh nghiệm"
          name="experience_years"
          type="number"
          min="0"
          value={formData.experience_years}
          onChange={handleChange}
        />

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-800">
            Công việc mong muốn
          </span>
          <input
            type="text"
            name="desired_job"
            value={formData.desired_job}
            onChange={handleChange}
            placeholder="Ví dụ: kỹ sư xây dựng, điều dưỡng viên"
            className="hp-input"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-[#EF4444] md:col-span-2">
            {errorMessage}
          </div>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="hp-btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isLoading ? "Đang tìm..." : "Tìm đơn hàng phù hợp"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
        </div>
      ) : hasSearched && recommendations.length === 0 ? (
        <div className="hp-panel p-8 text-center text-slate-700">
          Không tìm thấy đơn hàng phù hợp
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((item) => (
            <article
              key={item.job_order.id}
              className="hp-panel p-5 transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#064E3B]">
                    {item.job_order.job_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.job_order.company_name}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-[#10B981] ring-1 ring-emerald-100">
                  {item.score} điểm
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-md bg-[#F0FDF4] p-4 text-sm text-slate-800 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-950">Vị trí</p>
                  <p>{item.job_order.job_position || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Lương</p>
                  <p>{formatSalary(item.job_order)}</p>
                </div>
              </div>

              <Link
                to={`/jobs/${item.job_order.id}`}
                className="hp-btn-primary mt-5 px-4 py-2 text-sm"
              >
                Xem chi tiết
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function Input({ label, name, value, onChange, type = "text", min }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        type={type}
        name={name}
        min={min}
        value={value}
        onChange={onChange}
        className="hp-input"
      />
    </label>
  )
}


