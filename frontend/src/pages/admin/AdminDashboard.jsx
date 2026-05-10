import { useEffect, useMemo, useState } from "react"

import api from "../../services/api.js"
import { normalizePhone, validateRegistrationForm } from "../../utils/validation.js"

const emptyUserForm = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  role: "consultant",
}

const roleLabels = {
  candidate: "Ứng viên",
  consultant: "Tư vấn viên",
  admin: "Quản trị viên",
}

const roleClasses = {
  candidate: "bg-emerald-50 text-emerald-700",
  consultant: "bg-orange-50 text-orange-700",
  admin: "bg-slate-900 text-white",
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState("")
  const [formData, setFormData] = useState(emptyUserForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const canAccess = currentUser?.role === "admin"

  const filteredUsers = useMemo(() => {
    if (!roleFilter) {
      return users
    }

    return users.filter((user) => user.role === roleFilter)
  }, [roleFilter, users])

  async function loadAdminData() {
    try {
      setIsLoading(true)
      setErrorMessage("")

      const [meResponse, dashboardResponse, usersResponse] = await Promise.all([
        api.get("/auth/me"),
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
      ])

      setCurrentUser(meResponse.data)
      setDashboard(dashboardResponse.data)
      setUsers(usersResponse.data)
      localStorage.setItem("user", JSON.stringify(meResponse.data))
      localStorage.setItem("user_id", meResponse.data.id)
      localStorage.setItem("user_name", meResponse.data.full_name)
      localStorage.setItem("user_role", meResponse.data.role)
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail || "Không thể tải trang quản trị",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAdminData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setMessage("")
    setErrorMessage("")

    const validationMessage = validateRegistrationForm(formData, {
      requirePhone: false,
    })

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    try {
      setIsSaving(true)
      await api.post("/admin/users", {
        ...formData,
        full_name: formData.full_name.trim().replace(/\s+/g, " "),
        email: formData.email.trim(),
        phone: formData.phone ? normalizePhone(formData.phone) : null,
      })
      setFormData(emptyUserForm)
      setMessage("Tạo tài khoản thành công")
      await loadAdminData()
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Không thể tạo tài khoản")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRoleChange(user, role) {
    if (user.role === role) {
      return
    }

    try {
      setMessage("")
      setErrorMessage("")
      await api.put(`/admin/users/${user.id}/role`, { role })
      setMessage(`Đã cập nhật quyền cho ${user.full_name}`)
      await loadAdminData()
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Không thể cập nhật quyền")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-red-700">
        Bạn không có quyền truy cập trang quản trị
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="hp-page-heading">
        <p className="hp-eyebrow">Quản trị hệ thống</p>
        <h1 className="hp-title">Admin dashboard</h1>
        <p className="hp-subtitle">
          Theo dõi số liệu chính và quản lý quyền tài khoản trong hệ thống.
        </p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Tổng người dùng" value={dashboard?.users?.total} />
        <MetricCard label="Ứng viên" value={dashboard?.users?.candidates} />
        <MetricCard label="Tư vấn viên" value={dashboard?.users?.consultants} />
        <MetricCard label="Phiên phỏng vấn" value={dashboard?.interviews?.total_sessions} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.3fr]">
        <form className="hp-panel space-y-4 p-5" onSubmit={handleCreateUser}>
          <div>
            <p className="hp-eyebrow">Tài khoản nội bộ</p>
            <h2 className="mt-1 text-xl font-black text-[#064E3B]">
              Tạo tài khoản
            </h2>
          </div>

          <Input label="Họ và tên" name="full_name" value={formData.full_name} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
          <Input label="Mật khẩu" name="password" type="password" value={formData.password} onChange={handleChange} />
          <Input label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#064E3B]">Vai trò</span>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="hp-input"
            >
              <option value="consultant">Tư vấn viên</option>
              <option value="admin">Quản trị viên</option>
              <option value="candidate">Ứng viên</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="hp-btn-primary w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSaving ? "Đang lưu..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="hp-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#BBF7D0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="hp-eyebrow">Người dùng</p>
              <h2 className="mt-1 text-xl font-black text-[#064E3B]">
                Quản lý quyền
              </h2>
            </div>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="hp-input max-w-xs"
            >
              <option value="">Tất cả vai trò</option>
              <option value="candidate">Ứng viên</option>
              <option value="consultant">Tư vấn viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#ECFDF5] text-[#064E3B]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Họ tên</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Vai trò</th>
                  <th className="px-4 py-3 font-semibold">Đổi quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBF7D0]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="text-[#064E3B]">
                    <td className="px-4 py-3 font-semibold">{user.full_name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-md px-2 py-1 text-xs font-bold",
                          roleClasses[user.role] || "bg-slate-50 text-slate-700",
                        ].join(" ")}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(event) => handleRoleChange(user, event.target.value)}
                        className="hp-input"
                      >
                        <option value="candidate">Ứng viên</option>
                        <option value="consultant">Tư vấn viên</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="hp-panel p-5">
      <p className="text-sm font-semibold text-[#059669]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#064E3B]">
        {value ?? 0}
      </p>
    </div>
  )
}

function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#064E3B]">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="hp-input"
      />
    </label>
  )
}
