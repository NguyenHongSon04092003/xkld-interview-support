const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const phonePattern = /^\+?\d{8,15}$/

export function normalizePhone(value = "") {
  return value.replace(/[\s.-]/g, "")
}

export function validateRegistrationForm(formData, options = {}) {
  const { requirePhone = false } = options
  const fullName = formData.full_name.trim().replace(/\s+/g, " ")
  const email = formData.email.trim()
  const phone = normalizePhone(formData.phone)

  if (!fullName || !email || !formData.password || (requirePhone && !phone)) {
    return "Vui lòng nhập họ tên, email và mật khẩu"
  }

  if (fullName.length < 2) {
    return "Họ tên quá ngắn"
  }

  if (!emailPattern.test(email)) {
    return "Email không hợp lệ"
  }

  if (phone && !phonePattern.test(phone)) {
    return "Số điện thoại không hợp lệ"
  }

  if (formData.password.length < 6) {
    return "Mật khẩu cần ít nhất 6 ký tự"
  }

  return ""
}
