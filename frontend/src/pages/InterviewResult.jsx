import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import api from "../services/api.js"

function getScoreColor(score) {
  if (score >= 80) {
    return "text-[#10B981]"
  }
  if (score >= 60) {
    return "text-[#059669]"
  }
  if (score >= 40) {
    return "text-[#F28C28]"
  }
  return "text-[#EF4444]"
}

function getScoreBadge(score) {
  if (score >= 80) {
    return "bg-emerald-50 text-[#10B981]"
  }
  if (score >= 60) {
    return "bg-emerald-50 text-[#047857]"
  }
  if (score >= 40) {
    return "bg-amber-50 text-[#F28C28]"
  }
  return "bg-red-50 text-[#EF4444]"
}

function formatScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return "--"
  }

  return Number(score).toFixed(1)
}

function readLocalAnswers(sessionId) {
  try {
    return JSON.parse(localStorage.getItem(`interview_answers_${sessionId}`) || "[]")
  } catch {
    return []
  }
}

function buildFallbackResult(session, sessionId) {
  if (!session?.total_score && !session?.content_score && !session?.behavior_score) {
    return null
  }

  return {
    total_score: Number(session.total_score || 0),
    avg_content_score: Number(session.content_score || 0),
    behavior_score: Number(session.behavior_score || 0),
    final_feedback: session.final_feedback || "Da tai diem tu phien phong van.",
    answers_detail: readLocalAnswers(sessionId),
  }
}

function getLoadErrorMessage(error) {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }

  if (error.response?.status) {
    return `Không thể tải kết quả phỏng vấn (HTTP ${error.response.status})`
  }

  return "Không thể kết nối backend để tải kết quả phỏng vấn"
}

function buildSuggestions(feedback) {
  const normalizedFeedback = (feedback || "").toLowerCase()
  const suggestions = []

  if (normalizedFeedback.includes("noi dung") || normalizedFeedback.includes("nội dung")) {
    suggestions.push("Ôn lại các ý chính và bổ sung ví dụ cụ thể cho từng câu trả lời.")
  }

  if (
    normalizedFeedback.includes("tac phong") ||
    normalizedFeedback.includes("tác phong") ||
    normalizedFeedback.includes("anh mat") ||
    normalizedFeedback.includes("ánh mắt")
  ) {
    suggestions.push("Tập nhìn vào camera, giữ tư thế ổn định và hạn chế rời khung hình.")
  }

  if (
    normalizedFeedback.includes("luyen tap") ||
    normalizedFeedback.includes("luyện tập") ||
    normalizedFeedback.includes("co gang") ||
    normalizedFeedback.includes("cố gắng")
  ) {
    suggestions.push("Thử phỏng vấn lại với từng câu hỏi và ghi chú những ý còn thiếu.")
  }

  if (!suggestions.length) {
    suggestions.push("Duy trì cách trả lời ngắn gọn, đúng trọng tâm và tự tin hơn ở lần sau.")
  }

  return suggestions
}

export default function InterviewResult() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadResult() {
      try {
        setIsLoading(true)
        setErrorMessage("")

        const sessionResponse = await api.get(`/mock-interviews/sessions/${sessionId}`)
        let finalData

        try {
          const finalResponse = await api.post(`/scoring/final/${sessionId}`)
          finalData = finalResponse.data
        } catch (scoreError) {
          finalData = buildFallbackResult(sessionResponse.data, sessionId)

          if (!finalData) {
            throw scoreError
          }
        }

        if (isMounted) {
          setResult(finalData)
          setSession(sessionResponse.data)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getLoadErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadResult()

    return () => {
      isMounted = false
    }
  }, [sessionId])

  const answersDetail = useMemo(() => {
    const apiAnswers = result?.answers_detail || []
    const localAnswers = readLocalAnswers(sessionId)

    if (apiAnswers.length >= localAnswers.length) {
      return apiAnswers
    }

    return localAnswers.map((localAnswer, index) => {
      const apiAnswer = apiAnswers.find(
        (answer) => answer.question_id === localAnswer.question_id,
      )

      return {
        id: apiAnswer?.id || index + 1,
        question_id: localAnswer.question_id,
        question_content: apiAnswer?.question_content,
        answer_text: apiAnswer?.answer_text || localAnswer.answer_text,
        content_score: apiAnswer?.content_score,
        behavior_score:
          apiAnswer?.behavior_score ?? localAnswer.behavior_score,
        feedback: apiAnswer?.feedback,
      }
    })
  }, [result, sessionId])

  const suggestions = useMemo(
    () => buildSuggestions(result?.final_feedback),
    [result],
  )

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

  if (!result || !session) {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-6 text-[#F28C28]">
        Không tìm thấy kết quả phỏng vấn
      </div>
    )
  }

  return (
    <section className="space-y-8">
      <div className="hp-page-heading">
        <p className="hp-eyebrow">
          Kết quả phỏng vấn
        </p>
        <h1 className="hp-title">
          Tổng kết buổi phỏng vấn
        </h1>
        <p className="hp-subtitle">
          Xem lại điểm tổng, điểm nội dung, điểm tác phong và nhận xét cho từng câu trả lời.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="hp-panel p-6">
          <p className="text-sm font-semibold text-[#059669]">Điểm tổng</p>
          <p
            className={[
              "mt-3 text-6xl font-bold",
              getScoreColor(result.total_score),
            ].join(" ")}
          >
            {formatScore(result.total_score)}
          </p>
        </div>

        <div className="hp-panel p-6">
          <p className="text-sm font-semibold text-[#059669]">Nội dung 40%</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">
            {formatScore(result.avg_content_score)}
          </p>
        </div>

        <div className="hp-panel p-6">
          <p className="text-sm font-semibold text-[#059669]">Tác phong 60%</p>
          <p className="mt-3 text-4xl font-bold text-slate-950">
            {formatScore(result.behavior_score)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#BBF7D0] bg-[#ECFDF5] p-5">
        <p className="text-sm font-semibold text-[#059669]">Nhận xét tổng</p>
        <p className="mt-2 text-lg font-semibold text-slate-950">
          {result.final_feedback || "Chưa có nhận xét"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Chi tiết từng câu
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Xem lại câu trả lời, điểm nội dung và điểm tác phong của từng câu.
          </p>
        </div>

        {answersDetail.length ? (
          answersDetail.map((answer, index) => (
            <article
              key={`${answer.question_id}-${answer.id || index}`}
              className="hp-panel p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#059669]">
                    Câu {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#064E3B]">
                    {answer.question_content ||
                      `Mã câu hỏi: ${answer.question_id}`}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-sm font-semibold",
                      getScoreBadge(answer.content_score || 0),
                    ].join(" ")}
                  >
                    Nội dung {formatScore(answer.content_score)}
                  </span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-sm font-semibold",
                      getScoreBadge(answer.behavior_score || 0),
                    ].join(" ")}
                  >
                    Tác phong {formatScore(answer.behavior_score)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[#059669]">
                    Câu trả lời của bạn
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-md bg-[#F0FDF4] p-4 text-slate-900">
                    {answer.answer_text || "Chưa có câu trả lời"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#059669]">
                    Nhận xét câu này
                  </p>
                  <p className="mt-2 rounded-md bg-[#F0FDF4] p-4 text-slate-900">
                    {answer.feedback || "Chưa có nhận xét"}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 text-[#F28C28]">
            Chưa có chi tiết câu trả lời
          </div>
        )}
      </div>

      <div className="hp-panel p-6">
        <h2 className="text-2xl font-black text-[#064E3B]">Gợi ý cải thiện</h2>
        <ul className="mt-4 space-y-2 text-slate-800">
          {suggestions.map((suggestion) => (
            <li key={suggestion} className="rounded-md bg-[#F0FDF4] px-4 py-3">
              {suggestion}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/mock-interview/${session.job_order_id}`)
            }
            className="hp-btn-primary px-4 py-2 text-sm"
          >
            Phỏng vấn lại
          </button>
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="hp-btn-secondary px-4 py-2 text-sm"
          >
            Xem đơn hàng khác
          </button>
        </div>
      </div>
    </section>
  )
}


