import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"

const navLinkClass = ({ isActive }) =>
  [
    "rounded-md px-3 py-2 text-sm font-bold",
    isActive
      ? "bg-[#ECFDF5] text-[#059669]"
      : "text-slate-700 hover:bg-[#ECFDF5] hover:text-[#059669]",
  ].join(" ")

const manageLinkClass = ({ isActive }) =>
  [
    "rounded-md px-3 py-2 text-sm font-bold",
    isActive
      ? "bg-[#FFF4E8] text-[#B85C00]"
      : "bg-[#FFF9F0] text-[#B85C00] hover:bg-[#FFF4E8]",
  ].join(" ")

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"))
  } catch {
    return null
  }
}

export default function Navbar() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const token = localStorage.getItem("access_token")
  const user = getStoredUser()
  const role = user?.role || localStorage.getItem("user_role")
  const userName = user?.full_name || localStorage.getItem("user_name")
  const canManageJobOrders = role === "consultant" || role === "admin"
  const canAccessAdmin = role === "admin"

  function closeMenu() {
    setIsMenuOpen(false)
  }

  function handleLogout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_name")
    localStorage.removeItem("user_role")
    closeMenu()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#BBF7D0] bg-white/95 shadow-sm backdrop-blur">
      <div className="bg-[#064E3B] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs font-semibold sm:px-6 lg:px-8">
          <span>Kết nối Việt Nam với thế giới</span>
          <span className="hidden sm:inline">Nâng tầm giá trị con người</span>
        </div>
      </div>

      <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-[#059669] text-lg font-black text-white shadow-sm">
              HP
            </span>
            <span>
              <span className="block text-lg font-black leading-tight text-[#064E3B]">
                XKLD Platform
              </span>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#F28C28]">
                Hải Phong Group
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="rounded-md border border-[#BBF7D0] px-3 py-2 text-sm font-bold text-[#064E3B] hover:bg-[#ECFDF5] md:hidden"
            aria-label="Mở menu"
          >
            Menu
          </button>
        </div>

        <div
          className={[
            "mt-4 flex-col gap-2 md:mt-0 md:flex md:flex-row md:items-center md:justify-end",
            isMenuOpen ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          <NavLink to="/" className={navLinkClass} onClick={closeMenu}>
            Trang chủ
          </NavLink>
          <NavLink to="/jobs" className={navLinkClass} onClick={closeMenu}>
            Đơn hàng
          </NavLink>
          <NavLink to="/recommendation" className={navLinkClass} onClick={closeMenu}>
            Gợi ý đơn hàng
          </NavLink>

          {token ? (
            <>
              <NavLink to="/interview-history" className={navLinkClass} onClick={closeMenu}>
                Lịch sử phỏng vấn
              </NavLink>

              {canManageJobOrders ? (
                <NavLink to="/consultant/job-orders" className={manageLinkClass} onClick={closeMenu}>
                  Quản lý đơn hàng
                </NavLink>
              ) : null}

              {canAccessAdmin ? (
                <NavLink to="/admin" className={manageLinkClass} onClick={closeMenu}>
                  Admin
                </NavLink>
              ) : null}

              <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                {userName || "Người dùng"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="hp-btn-primary px-3 py-2 text-sm"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>
                Đăng nhập
              </NavLink>
              <NavLink to="/register" className={navLinkClass} onClick={closeMenu}>
                Đăng ký
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}


