import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

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

export default function JobOrderList() {
  const [jobOrders, setJobOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")

  useEffect(() => {
    let isMounted = true

    async function fetchJobOrders() {
      try {
        setIsLoading(true)
        setErrorMessage("")
        const response = await api.get("/job-orders")

        if (isMounted) {
          setJobOrders(response.data)
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Không thể tải danh sách đơn hàng")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchJobOrders()

    return () => {
      isMounted = false
    }
  }, [])

  const jobPositions = useMemo(() => {
    const positions = jobOrders
      .map((jobOrder) => jobOrder.job_position)
      .filter(Boolean)

    return [...new Set(positions)].sort()
  }, [jobOrders])

  const filteredJobOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return jobOrders.filter((jobOrder) => {
      const matchesSearch =
        !normalizedSearch ||
        jobOrder.job_name?.toLowerCase().includes(normalizedSearch) ||
        jobOrder.company_name?.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === "all" || jobOrder.status === statusFilter

      const matchesPosition =
        positionFilter === "all" || jobOrder.job_position === positionFilter

      return matchesSearch && matchesStatus && matchesPosition
    })
  }, [jobOrders, positionFilter, searchTerm, statusFilter])

  return (
    <section className="space-y-6">
      <div className="hp-page-heading">
        <p className="hp-eyebrow">Đơn hàng tuyển dụng</p>
        <h1 className="hp-title">Danh sách đơn hàng</h1>
        <p className="hp-subtitle">
          Tra cứu các đơn hàng đang tuyển, lọc nhanh theo vị trí và trạng thái để
          chọn lộ trình ôn luyện phù hợp.
        </p>
      </div>

      <div className="hp-panel grid gap-4 p-5 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-800">Tìm kiếm</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tên đơn hàng hoặc công ty"
            className="hp-input text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-800">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="hp-input text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="open">Đang tuyển</option>
            <option value="pending">Chờ mở</option>
            <option value="closed">Đang đóng</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-800">Vị trí</span>
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            className="hp-input text-sm"
          >
            <option value="all">Tất cả vị trí</option>
            {jobPositions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-[#EF4444]">
          {errorMessage}
        </div>
      ) : filteredJobOrders.length === 0 ? (
        <div className="hp-panel p-8 text-center text-slate-700">
          Không có đơn hàng phù hợp
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredJobOrders.map((jobOrder) => (
            <article
              key={jobOrder.id}
              className="hp-panel p-5 transition hover:-translate-y-1 hover:border-[#86EFAC]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#064E3B]">
                    {jobOrder.job_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {jobOrder.company_name}
                  </p>
                </div>
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                    statusClasses[jobOrder.status] || "bg-emerald-50 text-[#047857]",
                  ].join(" ")}
                >
                  {statusLabels[jobOrder.status] || jobOrder.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 rounded-md bg-[#F0FDF4] p-4 text-sm text-slate-800 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-950">Vị trí</p>
                  <p>{jobOrder.job_position || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Lương</p>
                  <p>{formatSalary(jobOrder)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Địa điểm</p>
                  <p>{jobOrder.location || "Chưa cập nhật"}</p>
                </div>
              </div>

              <Link
                to={`/jobs/${jobOrder.id}`}
                className="hp-btn-primary mt-5 px-4 py-2 text-sm"
              >
                Xem chi tiết
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}


