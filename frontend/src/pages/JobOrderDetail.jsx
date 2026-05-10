import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import api from "../services/api.js"

const statusLabels = {
  open: "Đang tuyển",
  pending: "Chờ mở",
  closed: "Đang đóng",
}

const statusClasses = {
  open: "bg-emerald-50 text-[#10B981] ring-1 ring-emerald-100",
  pending: "bg-amber-50 text-[#F28C28] ring-1 ring-amber-100",
  closed: "bg-red-50 text-[#EF4444] ring-1 ring-red-100",
}

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

function Field({ label, value }) {
  const hasValue = value !== null && value !== undefined && value !== ""

  return (
    <div className="rounded-md border border-[#BBF7D0] bg-white p-4">
      <p className="text-sm font-bold text-[#059669]">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">
        {hasValue ? value : "Chưa cập nhật"}
      </p>
    </div>
  )
}

function TextSection({ title, value }) {
  return (
    <section className="hp-panel p-5">
      <h2 className="text-lg font-black text-[#064E3B]">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-slate-700">
        {value || "Chưa cập nhật"}
      </p>
    </section>
  )
}

export default function JobOrderDetail() {
  const { id } = useParams()
  const [jobOrder, setJobOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchJobOrder() {
      try {
        setIsLoading(true)
        setIsNotFound(false)
        const response = await api.get(`/job-orders/${id}`)

        if (isMounted) {
          setJobOrder(response.data)
        }
      } catch {
        if (isMounted) {
          setIsNotFound(true)
          setJobOrder(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchJobOrder()

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
      </div>
    )
  }

  if (isNotFound || !jobOrder) {
    return (
      <div className="hp-panel p-8 text-center text-slate-700">
        Không tìm thấy đơn hàng
      </div>
    )
  }

  return (
    <article className="space-y-6">
      <div className="hp-panel overflow-hidden">
        <div className="h-2 bg-[#F28C28]" />
        <div className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="hp-eyebrow">
              Chi tiết đơn hàng
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#064E3B]">
              {jobOrder.job_name}
            </h1>
            <p className="mt-2 text-slate-600">{jobOrder.company_name}</p>
          </div>

          <span
            className={[
              "inline-flex rounded-full px-3 py-1 text-sm font-bold",
              statusClasses[jobOrder.status] || "bg-emerald-50 text-[#047857]",
            ].join(" ")}
          >
            {statusLabels[jobOrder.status] || jobOrder.status}
          </span>
        </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <TextSection title="Mô tả công việc" value={jobOrder.job_description} />
          <TextSection
            title="Yêu cầu phỏng vấn"
            value={jobOrder.interview_requirement}
          />
        </div>

        <aside className="space-y-4">
          <Field label="Công ty" value={jobOrder.company_name} />
          <Field label="Vị trí công việc" value={jobOrder.job_position} />
          <Field label="Mức lương" value={formatSalary(jobOrder)} />
          <Field label="Địa điểm" value={jobOrder.location} />
          <Field label="Số lượng tuyển" value={jobOrder.quantity} />
          <Field
            label="Độ tuổi"
            value={
              jobOrder.age_min || jobOrder.age_max
                ? `${jobOrder.age_min || "?"} - ${jobOrder.age_max || "?"}`
                : ""
            }
          />
          <Field label="Giới tính yêu cầu" value={jobOrder.gender_requirement} />
          <Field label="Trình độ học vấn" value={jobOrder.education_level} />
          <Field label="Kinh nghiệm yêu cầu" value={jobOrder.experience_required} />
        </aside>
      </div>

      <div className="hp-panel flex flex-col gap-3 p-4 sm:flex-row">
        <Link
          to={`/practice/${jobOrder.id}`}
          className="rounded-md bg-[#0F9F6E] px-4 py-2 text-center text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          Ôn luyện phỏng vấn
        </Link>
        <Link
          to={`/mock-interview/${jobOrder.id}`}
          className="hp-btn-primary px-4 py-2 text-center text-sm"
        >
          Luyện phỏng vấn
        </Link>
        <Link
          to="/jobs"
          className="hp-btn-secondary px-4 py-2 text-center text-sm"
        >
          Xem đơn tương tự
        </Link>
        <Link
          to="/jobs"
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Quay lại
        </Link>
      </div>
    </article>
  )
}


