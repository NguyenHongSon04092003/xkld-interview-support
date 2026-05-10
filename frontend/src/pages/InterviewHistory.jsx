import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "../services/api.js"

function formatDate(value) {
  if (!value) {
    return "Chưa có thời gian"
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return "--"
  }

  return Number(score).toFixed(1)
}

function getScoreBadge(score) {
  const numericScore = Number(score || 0)

  if (numericScore >= 80) {
    return "bg-emerald-50 text-[#10B981]"
  }
  if (numericScore >= 60) {
    return "bg-emerald-50 text-[#047857]"
  }
  if (numericScore >= 40) {
    return "bg-amber-50 text-[#F28C28]"
  }
  return "bg-red-50 text-[#EF4444]"
}

export default function InterviewHistory() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [jobNames, setJobNames] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function getCandidateId() {
      const storedUserId = localStorage.getItem("user_id")

      if (storedUserId) {
        return storedUserId
      }

      const response = await api.get("/auth/me")
      localStorage.setItem("user_id", response.data.id)
      localStorage.setItem("user_name", response.data.full_name)
      localStorage.setItem("user_role", response.data.role)
      return response.data.id
    }

    async function loadHistory() {
      try {
        setIsLoading(true)
        setErrorMessage("")

        const candidateId = await getCandidateId()
        const sessionsResponse = await api.get(
          `/mock-interviews/sessions/candidate/${candidateId}`,
        )
        const sortedSessions = [...sessionsResponse.data].sort(
          (first, second) =>
            new Date(second.start_time || second.created_at) -
            new Date(first.start_time || first.created_at),
        )
        const uniqueJobIds = [
          ...new Set(sortedSessions.map((session) => session.job_order_id)),
        ]
        const jobResponses = await Promise.all(
          uniqueJobIds.map(async (jobId) => {
            try {
              const response = await api.get(`/job-orders/${jobId}`)
              return [jobId, response.data.job_name]
            } catch {
              return [jobId, `Đơn hàng #${jobId}`]
            }
          }),
        )

        if (isMounted) {
          setSessions(sortedSessions)
          setJobNames(Object.fromEntries(jobResponses))
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.detail ||
              "Không thể tải lịch sử phỏng vấn",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const completedSessions = sessions.filter((session) => session.end_time)
    const scoredSessions = completedSessions.filter(
      (session) => session.total_score !== null && session.total_score !== undefined,
    )
    const averageScore = scoredSessions.length
      ? scoredSessions.reduce(
          (sum, session) => sum + Number(session.total_score || 0),
          0,
        ) / scoredSessions.length
      : null
    const latestSession = sessions[0]

    return {
      totalCompleted: completedSessions.length,
      averageScore,
      latestSession,
    }
  }, [sessions])

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-[#EF4444]">
        {errorMessage}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="hp-page-heading">
        <p className="hp-eyebrow">
          Lịch sử phỏng vấn
        </p>
        <h1 className="hp-title">
          Các buổi phỏng vấn đã thực hiện
        </h1>
        <p className="hp-subtitle">
          Theo dõi tiến độ luyện tập, xem lại điểm số và mở lại kết quả từng phiên.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="hp-panel p-5">
          <p className="text-sm font-semibold text-[#059669]">
            Tổng số buổi đã phỏng vấn
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {stats.totalCompleted}
          </p>
        </div>
        <div className="hp-panel p-5">
          <p className="text-sm font-semibold text-[#059669]">
            Điểm trung bình tổng
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {formatScore(stats.averageScore)}
          </p>
        </div>
        <div className="hp-panel p-5">
          <p className="text-sm font-semibold text-[#059669]">
            Buổi phỏng vấn gần nhất
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {stats.latestSession
              ? formatDate(stats.latestSession.start_time || stats.latestSession.created_at)
              : "Chưa có"}
          </p>
        </div>
      </div>

      {sessions.length ? (
        <div className="hp-panel overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#ECFDF5]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Ngày phỏng vấn
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Tên đơn hàng
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Điểm tổng
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Điểm nội dung
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Điểm tác phong
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <tr key={session.id} className="align-top">
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {formatDate(session.start_time || session.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                    {jobNames[session.job_order_id] ||
                      `Đơn hàng #${session.job_order_id}`}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={[
                        "rounded-full px-3 py-1 font-semibold",
                        getScoreBadge(session.total_score),
                      ].join(" ")}
                    >
                      {formatScore(session.total_score)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {formatScore(session.content_score)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {formatScore(session.behavior_score)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={[
                        "rounded-full px-3 py-1 font-semibold",
                        session.end_time
                          ? "bg-emerald-50 text-[#10B981]"
                          : "bg-amber-50 text-[#F28C28]",
                      ].join(" ")}
                    >
                      {session.end_time ? "Đã hoàn thành" : "Chưa hoàn thành"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/interview-result/${session.id}`)}
                      className="hp-btn-primary px-3 py-2 text-sm"
                    >
                      Xem kết quả
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hp-panel p-8 text-center text-slate-700">
          Bạn chưa thực hiện buổi phỏng vấn nào
        </div>
      )}
    </section>
  )
}


