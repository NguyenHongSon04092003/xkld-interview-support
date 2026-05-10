import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import api from "../../services/api.js"

const emptyForm = {
  question_content: "",
  sample_answer: "",
  difficulty_level: "easy",
  score_weight: "",
  display_order: "",
}

function truncateText(value, maxLength = 50) {
  if (!value) {
    return "Chưa cập nhật"
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function normalizePayload(formData, jobId) {
  return {
    job_order_id: Number(jobId),
    question_content: formData.question_content,
    sample_answer: formData.sample_answer || null,
    difficulty_level: formData.difficulty_level || null,
    score_weight:
      formData.score_weight === "" ? null : Number(formData.score_weight),
    display_order:
      formData.display_order === "" ? null : Number(formData.display_order),
  }
}

function validateQuestionForm(formData) {
  if (!formData.question_content.trim()) {
    return "Vui lòng nhập nội dung câu hỏi"
  }

  const scoreWeight =
    formData.score_weight === "" ? null : Number(formData.score_weight)
  const displayOrder =
    formData.display_order === "" ? null : Number(formData.display_order)

  if (scoreWeight !== null && (!Number.isFinite(scoreWeight) || scoreWeight < 0)) {
    return "Trọng số không được nhập số âm"
  }

  if (displayOrder !== null && (!Number.isFinite(displayOrder) || displayOrder < 0)) {
    return "Số thứ tự không được nhập số âm"
  }

  return ""
}

export default function ManageQuestions() {
  const { jobId } = useParams()
  const [currentUser, setCurrentUser] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [jobOrder, setJobOrder] = useState(null)
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const sortedQuestions = useMemo(
    () =>
      [...questions].sort((first, second) => {
        const firstOrder = first.display_order ?? Number.MAX_SAFE_INTEGER
        const secondOrder = second.display_order ?? Number.MAX_SAFE_INTEGER
        return firstOrder - secondOrder || first.id - second.id
      }),
    [questions],
  )
  const canAccess = currentUser?.role === "consultant" || currentUser?.role === "admin"

  async function fetchData() {
    try {
      setIsLoading(true)
      setErrorMessage("")

      const [jobResponse, questionsResponse] = await Promise.all([
        api.get(`/job-orders/${jobId}`),
        api.get(`/interview-questions/${jobId}`),
      ])

      setJobOrder(jobResponse.data)
      setQuestions(questionsResponse.data)
    } catch {
      setErrorMessage("Không thể tải danh sách câu hỏi")
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
        fetchData()
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [canAccess, jobId])

  function openCreateModal() {
    setEditingQuestion(null)
    setFormData(emptyForm)
    setMessage("")
    setErrorMessage("")
    setIsModalOpen(true)
  }

  function openEditModal(question) {
    setEditingQuestion(question)
    setFormData({
      question_content: question.question_content || "",
      sample_answer: question.sample_answer || "",
      difficulty_level: question.difficulty_level || "easy",
      score_weight: question.score_weight || "",
      display_order: question.display_order || "",
    })
    setMessage("")
    setErrorMessage("")
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingQuestion(null)
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

    const validationMessage = validateQuestionForm(formData)

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      setIsSaving(true)
      const payload = normalizePayload(formData, jobId)

      if (editingQuestion) {
        await api.put(`/interview-questions/${editingQuestion.id}`, payload)
        setMessage("Cập nhật câu hỏi thành công")
      } else {
        await api.post("/interview-questions", payload)
        setMessage("Thêm câu hỏi thành công")
      }

      closeModal()
      await fetchData()
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Thao tác thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(question) {
    const confirmed = window.confirm("Xóa câu hỏi này?")

    if (!confirmed) {
      return
    }

    try {
      setMessage("")
      setErrorMessage("")
      await api.delete(`/interview-questions/${question.id}`)
      setMessage("Xóa câu hỏi thành công")
      await fetchData()
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Không thể xóa câu hỏi")
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
        Bạn không có quyền truy cập trang quản lý câu hỏi
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hp-page-heading">
          <p className="hp-eyebrow">
            Câu hỏi phỏng vấn
          </p>
          <h1 className="hp-title">
            {jobOrder?.job_name || "Quản lý câu hỏi"}
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/consultant/job-orders"
            className="hp-btn-secondary px-4 py-2 text-center text-sm"
          >
            Quay lại
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="hp-btn-primary px-4 py-2 text-sm"
          >
            Thêm câu hỏi mới
          </button>
        </div>
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
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Nội dung câu hỏi</th>
                <th className="px-4 py-3 font-semibold">Đáp án mẫu</th>
                <th className="px-4 py-3 font-semibold">Độ khó</th>
                <th className="px-4 py-3 font-semibold">Trọng số</th>
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
              ) : sortedQuestions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    Chưa có câu hỏi
                  </td>
                </tr>
              ) : (
                sortedQuestions.map((question) => (
                  <tr key={question.id} className="text-[#064E3B]">
                    <td className="px-4 py-3">{question.display_order || "Chưa cập nhật"}</td>
                    <td className="px-4 py-3 font-semibold">{question.question_content}</td>
                    <td className="px-4 py-3">{truncateText(question.sample_answer)}</td>
                    <td className="px-4 py-3">{question.difficulty_level || "Chưa cập nhật"}</td>
                    <td className="px-4 py-3">{question.score_weight || "Chưa cập nhật"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(question)}
                          className="rounded-md bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#059669] hover:bg-[#BBF7D0]"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(question)}
                          className="rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          Xóa
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#064E3B]">
                {editingQuestion ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
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
              <Textarea
                label="Nội dung câu hỏi"
                name="question_content"
                value={formData.question_content}
                onChange={handleChange}
              />
              <Textarea
                label="Đáp án mẫu"
                name="sample_answer"
                value={formData.sample_answer}
                onChange={handleChange}
              />

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#064E3B]">Độ khó</span>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="hp-input"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </label>

              <Input
                label="Trọng số"
                name="score_weight"
                type="number"
                min="0"
                max="100"
                value={formData.score_weight}
                onChange={handleChange}
              />
              <Input
                label="Số thứ tự"
                name="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={handleChange}
              />

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

function Input({ label, name, value, onChange, type = "text", min, max }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[#064E3B]">{label}</span>
      <input
        type={type}
        name={name}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="hp-input"
      />
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


