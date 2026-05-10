import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import api from "../services/api.js"
import { normalizePhone, validateRegistrationForm } from "../utils/validation.js"

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage("")

    const validationMessage = validateRegistrationForm(formData)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      setIsSubmitting(true)
      await api.post("/auth/register", {
        ...formData,
        full_name: formData.full_name.trim().replace(/\s+/g, " "),
        email: formData.email.trim(),
        phone: normalizePhone(formData.phone) || null,
      })
      navigate("/login")
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail ||
          "Không thể đăng ký tài khoản, vui lòng kiểm tra lại thông tin",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="hp-panel w-full max-w-lg overflow-hidden">
        <div className="h-2 bg-[#F28C28]" />
        <div className="p-7">
        <div className="mb-6 text-center">
          <p className="hp-eyebrow">Tạo hồ sơ ứng viên</p>
          <h1 className="mt-2 text-2xl font-black text-[#064E3B]">Đăng ký</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tạo tài khoản XKLD Platform
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-[#EF4444]">
            {errorMessage}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Họ và tên</span>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="hp-input"
              placeholder="Nguyễn Văn A"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="hp-input"
              placeholder="email@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Mật khẩu</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="hp-input"
              placeholder="Nhập mật khẩu"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Số điện thoại</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="hp-input"
              placeholder="0900000000"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="hp-btn-primary w-full px-4 py-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-700">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-[#059669] hover:underline">
            Đăng nhập
          </Link>
        </p>
        </div>
      </div>
    </section>
  )
}


