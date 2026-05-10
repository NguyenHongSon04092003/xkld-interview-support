import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import api from "../services/api.js"

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage("Vui lòng nhập email và mật khẩu")
      return
    }

    try {
      setIsSubmitting(true)
      const loginResponse = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      })
      localStorage.setItem("access_token", loginResponse.data.access_token)

      const meResponse = await api.get("/auth/me")
      localStorage.setItem("user", JSON.stringify(meResponse.data))
      localStorage.setItem("user_id", meResponse.data.id)
      localStorage.setItem("user_name", meResponse.data.full_name)
      localStorage.setItem("user_role", meResponse.data.role)

      if (meResponse.data.role === "admin") {
        navigate("/admin")
      } else if (meResponse.data.role === "consultant") {
        navigate("/consultant/job-orders")
      } else {
        navigate("/jobs")
      }
    } catch {
      setErrorMessage("Email hoặc mật khẩu không đúng")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="hp-panel w-full max-w-md overflow-hidden">
        <div className="h-2 bg-[#F28C28]" />
        <div className="p-7">
        <div className="mb-6 text-center">
          <p className="hp-eyebrow">XKLD Platform</p>
          <h1 className="mt-2 text-2xl font-black text-[#064E3B]">Đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-600">
            Truy cập tài khoản XKLD Platform
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-[#EF4444]">
            {errorMessage}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="hp-btn-primary w-full px-4 py-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-700">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-[#059669] hover:underline">
            Đăng ký
          </Link>
        </p>
        </div>
      </div>
    </section>
  )
}


