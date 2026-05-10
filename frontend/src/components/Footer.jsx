export default function Footer() {
  return (
    <footer className="mt-8 border-t border-[#BBF7D0] bg-[#064E3B] text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-black">XKLD Platform</p>
          <p className="mt-2 max-w-md text-white/75">
            Hệ thống hỗ trợ ứng viên luyện phỏng vấn, ôn câu hỏi và theo dõi kết quả
            trước khi tham gia đơn hàng xuất khẩu lao động.
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-[#F28C28]">Liên hệ</p>
          <p className="mt-2 text-white/75">Hải Phong Building, 19 Trần Thủ Độ, Hà Nội</p>
          <p className="text-white/75">1800 6770</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-[#F28C28]">Mục tiêu</p>
          <p className="mt-2 text-white/75">Kết nối Việt Nam với thế giới.</p>
          <p className="text-white/75">Nâng tầm giá trị con người.</p>
        </div>
      </div>
    </footer>
  )
}


