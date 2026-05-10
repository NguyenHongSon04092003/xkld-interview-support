import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "../../services/api.js"

const emptyForm = {
  job_name: "",
  company_name: "",
  status: "open",
  job_position: "",
  salary_min: "",
  salary_max: "",
  location: "",
  quantity: "",
  age_min: "",
  age_max: "",
  gender_requirement: "Không yêu cầu",
  education_level: "Không yêu cầu",
  experience_required: "",
  job_description: "",
  interview_requirement: "",
}

const genderOptions = ["Nam", "Nữ", "Nam/Nữ", "Không yêu cầu"]
const educationOptions = [
  "Trung học phổ thông",
  "Cao đẳng",
  "Đại học",
  "Không yêu cầu",
]
const statusOptions = [
  { value: "open", label: "Đang tuyển" },
  { value: "pending", label: "Chờ mở" },
  { value: "closed", label: "Đang đóng" },
]

const statusLabels = {
  open: "Đang tuyển",
  pending: "Chờ mở",
  closed: "Đang đóng",
}

const statusClasses = {
  open: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  closed: "bg-red-100 text-red-700",
}

function normalizePayload(formData) {
  const numberFields = ["salary_min", "salary_max", "quantity", "age_min", "age_max"]
  const payload = { ...formData }

  numberFields.forEach((field) => {
    payload[field] = payload[field] === "" ? null : Number(payload[field])
  })
  payload.salary = payload.salary_min
  payload.experience_required =
    payload.experience_required === "" ? null : String(Number(payload.experience_required))

  Object.keys(payload).forEach((key) => {
    if (!numberFields.includes(key) && payload[key] === "") {
      payload[key] = null
    }
  })

  return payload
}

function getExperienceFormValue(value) {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  const match = String(value).match(/\d+(?:[.,]\d+)?/)
  return match ? match[0].replace(",", ".") : ""
}

function validateJobOrderForm(formData) {
  const numberValue = (field) =>
    formData[field] === "" ? null : Number(formData[field])

  if (!formData.job_name.trim() || !formData.company_name.trim()) {
    return "Vui lòng nhập tên đơn hàng và công ty"
  }

  if (!genderOptions.includes(formData.gender_requirement)) {
    return "Giới tính yêu cầu không hợp lệ"
  }

  if (!educationOptions.includes(formData.education_level)) {
    return "Trình độ học vấn không hợp lệ"
  }

  const numericFields = [
    ["quantity", "Số lượng tuyển"],
    ["age_min", "Tuổi tối thiểu"],
    ["age_max", "Tuổi tối đa"],
    ["experience_required", "Số năm kinh nghiệm"],
    ["salary_min", "Mức lương tối thiểu"],
    ["salary_max", "Mức lương tối đa"],
  ]

  for (const [field, label] of numericFields) {
    const value = numberValue(field)

    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      return `${label} không được nhập số âm`
    }
  }

  const quantity = numberValue("quantity")
  if (quantity !== null && quantity < 0) {
    return "Số lượng tuyển phải lớn hơn hoặc bằng 0"
  }

  const ageMin = numberValue("age_min")
  if (ageMin !== null && ageMin < 18) {
    return "Tuổi tối thiểu phải lớn hơn hoặc bằng 18"
  }

  const ageMax = numberValue("age_max")
  if (ageMin !== null && ageMax !== null && ageMax < ageMin) {
    return "Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu"
  }

  const salaryMin = numberValue("salary_min")
  const salaryMax = numberValue("salary_max")
  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
    return "Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu"
  }

  return ""
}

export default function ManageJobOrders() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [jobOrders, setJobOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJobOrder, setEditingJobOrder] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const canAccess = currentUser?.role === "consultant" || currentUser?.role === "admin"

  const sortedJobOrders = useMemo(
    () => [...jobOrders].sort((first, second) => second.id - first.id),
    [jobOrders],
  )

  async function fetchJobOrders() {
    try {
      setIsLoading(true)
      const response = await api.get("/job-orders")
      setJobOrders(response.data)
    } catch {
      setErrorMessage("Không thể tải danh sách đơn hàng")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function checkCurrentUser() {
      try {
        const response = await api.get("/auth/me")

        if (isMounted) {
          setCurrentUser(response.data)
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null)
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      }
    }

    checkCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (canAccess) {
      const timeoutId = window.setTimeout(() => {
        fetchJobOrders()
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [canAccess])

  function openCreateModal() {
    setEditingJobOrder(null)
    setFormData(emptyForm)
    setMessage("")
    setErrorMessage("")
    setIsModalOpen(true)
  }

  function openEditModal(jobOrder) {
    setEditingJobOrder(jobOrder)
    setFormData({
      job_name: jobOrder.job_name || "",
      company_name: jobOrder.company_name || "",
      status: jobOrder.status || "open",
      job_position: jobOrder.job_position || "",
      salary_min: jobOrder.salary_min ?? jobOrder.salary ?? "",
      salary_max: jobOrder.salary_max ?? "",
      location: jobOrder.location || "",
      quantity: jobOrder.quantity ?? "",
      age_min: jobOrder.age_min || "",
      age_max: jobOrder.age_max || "",
      gender_requirement: jobOrder.gender_requirement || "Không yêu cầu",
      education_level: jobOrder.education_level || "Không yêu cầu",
      experience_required: getExperienceFormValue(jobOrder.experience_required),
      job_description: jobOrder.job_description || "",
      interview_requirement: jobOrder.interview_requirement || "",
    })
    setMessage("")
    setErrorMessage("")
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingJobOrder(null)
    setFormData(emptyForm)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")
    setErrorMessage("")

    const validationMessage = validateJobOrderForm(formData)

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      setIsSaving(true)
      const payload = normalizePayload(formData)

      if (editingJobOrder) {
        await api.put(`/job-orders/${editingJobOrder.id}`, payload)
        setMessage("Cập nhật đơn hàng thành công")
      } else {
        await api.post("/job-orders", payload)
        setMessage("Thêm đơn hàng thành công")
      }

      closeModal()
      await fetchJobOrders()
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Thao tác thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(jobOrder) {
    const confirmed = window.confirm(`Xóa đơn hàng "${jobOrder.job_name}"?`)

    if (!confirmed) {
      return
    }

    try {
      setMessage("")
      setErrorMessage("")
      await api.delete(`/job-orders/${jobOrder.id}`)
      setMessage("Xóa đơn hàng thành công")
      await fetchJobOrders()
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Không thể xóa đơn hàng")
    }
  }

  async function updateJobOrderField(jobOrder, field, value) {
    try {
      setMessage("")
      setErrorMessage("")
      const payload = { [field]: value }

      if (field === "quantity" && value !== null && value < 0) {
        setErrorMessage("Số lượng tuyển không được nhập số âm")
        return
      }

      await api.put(`/job-orders/${jobOrder.id}`, payload)
      setJobOrders((current) =>
        current.map((item) =>
          item.id === jobOrder.id ? { ...item, [field]: value } : item,
        ),
      )
      setMessage("Cập nhật đơn hàng thành công")
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Không thể cập nhật đơn hàng")
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-red-700">
        Bạn không có quyền truy cập trang quản lý đơn hàng
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hp-page-heading">
          <p className="hp-eyebrow">
            Tư vấn viên
          </p>
          <h1 className="hp-title">
            Quản lý đơn hàng
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="hp-btn-primary px-4 py-2 text-sm"
        >
          Thêm đơn hàng mới
        </button>
      </div>

      {message ? (
        <div className="rounded-md bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="hp-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#ECFDF5] text-[#064E3B]">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên đơn hàng</th>
                <th className="px-4 py-3 font-semibold">Công ty</th>
                <th className="px-4 py-3 font-semibold">Vị trí</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Số lượng</th>
                <th className="px-4 py-3 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BBF7D0]">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : sortedJobOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    Chưa có đơn hàng
                  </td>
                </tr>
              ) : (
                sortedJobOrders.map((jobOrder) => (
                  <tr key={jobOrder.id} className="text-[#064E3B]">
                    <td className="px-4 py-3 font-semibold">{jobOrder.job_name}</td>
                    <td className="px-4 py-3">{jobOrder.company_name}</td>
                    <td className="px-4 py-3">{jobOrder.job_position || "Chưa cập nhật"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={jobOrder.status}
                        onChange={(event) =>
                          updateJobOrderField(jobOrder, "status", event.target.value)
                        }
                        className={[
                          "rounded-md border-0 px-2 py-1 text-xs font-semibold outline-none ring-1 ring-transparent",
                          statusClasses[jobOrder.status] || "bg-[#ECFDF5] text-[#059669]",
                        ].join(" ")}
                        aria-label="Trạng thái đơn hàng"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={jobOrder.quantity ?? ""}
                        onChange={(event) => {
                          const nextValue =
                            event.target.value === "" ? null : Number(event.target.value)
                          updateJobOrderField(jobOrder, "quantity", nextValue)
                        }}
                        className="hp-input w-24 px-2 py-1 text-sm"
                        aria-label="Số lượng tuyển"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(jobOrder)}
                          className="rounded-md bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#059669] hover:bg-[#BBF7D0]"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(jobOrder)}
                          className="rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/consultant/questions/${jobOrder.id}`)}
                          className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          Quản lý câu hỏi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#064E3B]/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#064E3B]">
                {editingJobOrder ? "Sửa đơn hàng" : "Thêm đơn hàng mới"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-2 py-1 text-[#047857] hover:bg-emerald-50"
              >
                Đóng
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <Input label="Tên đơn hàng" name="job_name" value={formData.job_name} onChange={handleChange} />
              <Input label="Công ty" name="company_name" value={formData.company_name} onChange={handleChange} />
              <Select label="Trạng thái đơn hàng" name="status" value={formData.status} onChange={handleChange} options={statusOptions} />
              <Input label="Vị trí" name="job_position" value={formData.job_position} onChange={handleChange} />
              <Input label="Mức lương tối thiểu" name="salary_min" type="number" min="0" value={formData.salary_min} onChange={handleChange} />
              <Input label="Mức lương tối đa" name="salary_max" type="number" min="0" value={formData.salary_max} onChange={handleChange} />
              <Input label="Địa điểm" name="location" value={formData.location} onChange={handleChange} />
              <Input label="Số lượng tuyển" name="quantity" type="number" min="0" value={formData.quantity} onChange={handleChange} />
              <Input label="Tuổi tối thiểu" name="age_min" type="number" min="18" value={formData.age_min} onChange={handleChange} />
              <Input label="Tuổi tối đa" name="age_max" type="number" min="18" value={formData.age_max} onChange={handleChange} />
              <Select label="Giới tính yêu cầu" name="gender_requirement" value={formData.gender_requirement} onChange={handleChange} options={genderOptions} />
              <Select label="Trình độ học vấn" name="education_level" value={formData.education_level} onChange={handleChange} options={educationOptions} />
              <Input label="Số năm kinh nghiệm" name="experience_required" type="number" min="0" value={formData.experience_required} onChange={handleChange} />
              <Textarea label="Mô tả công việc" name="job_description" value={formData.job_description} onChange={handleChange} />
              <Textarea label="Yêu cầu phỏng vấn" name="interview_requirement" value={formData.interview_requirement} onChange={handleChange} />

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="hp-btn-secondary px-4 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="hp-btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function Input({ label, name, value, onChange, type = "text", min }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[#064E3B]">{label}</span>
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

function Select({ label, name, value, onChange, options }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[#064E3B]">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="hp-input"
      >
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value
          const label = typeof option === "string" ? option : option.label

          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function Textarea({ label, name, value, onChange }) {
  return (
    <label className="space-y-2 md:col-span-2">
      <span className="text-sm font-medium text-[#064E3B]">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows="4"
        className="hp-input"
      />
    </label>
  )
}



