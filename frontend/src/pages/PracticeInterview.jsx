import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import api from "../services/api.js"

const difficultyClasses = {
  easy: "bg-emerald-50 text-[#10B981]",
  medium: "bg-amber-50 text-[#F28C28]",
  hard: "bg-red-50 text-[#EF4444]",
}

function getKeywords(question) {
  if (Array.isArray(question.keywords)) {
    return question.keywords
  }

  if (Array.isArray(question.question_keywords)) {
    return question.question_keywords.map((item) => item.keyword || item)
  }

  return []
}

export default function PracticeInterview() {
  const { jobId } = useParams()
  const [jobOrder, setJobOrder] = useState(null)
  const [questions, setQuestions] = useState([])
  const [openQuestionIds, setOpenQuestionIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadPracticeData() {
      try {
        setIsLoading(true)
        setErrorMessage("")

        const [jobResponse, questionsResponse] = await Promise.all([
          api.get(`/job-orders/${jobId}`),
          api.get(`/interview-questions/${jobId}`),
        ])

        if (isMounted) {
          setJobOrder(jobResponse.data)
          setQuestions(questionsResponse.data)
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Không thể tải dữ liệu ôn luyện")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPracticeData()

    return () => {
      isMounted = false
    }
  }, [jobId])

  function toggleQuestion(questionId) {
    setOpenQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    )
  }

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
      <div className="hp-panel p-6">
        <p className="hp-eyebrow">
          Ôn luyện phỏng vấn
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#064E3B]">
          {jobOrder?.job_name || "Đơn hàng"}
        </h1>
        <p className="mt-2 text-slate-600">
          Xem trước câu hỏi, đáp án mẫu và các ý quan trọng trước khi phỏng vấn.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/mock-interview/${jobId}`}
          className="hp-btn-primary px-4 py-2 text-center text-sm"
        >
          Bắt đầu phỏng vấn thử
        </Link>
        <Link
          to={`/jobs/${jobId}`}
          className="hp-btn-secondary px-4 py-2 text-center text-sm"
        >
          Quay lại
        </Link>
      </div>

      {questions.length ? (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const isOpen = openQuestionIds.includes(question.id)
            const keywords = getKeywords(question)

            return (
              <article
                key={question.id}
                className="hp-panel p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#059669]">
                      Câu {question.display_order || index + 1}
                    </p>
                    <h2 className="mt-2 text-xl font-black text-[#064E3B]">
                      {question.question_content}
                    </h2>
                  </div>
                  <span
                    className={[
                      "w-fit rounded-full px-3 py-1 text-sm font-semibold",
                      difficultyClasses[question.difficulty_level] ||
                        "bg-emerald-50 text-[#047857]",
                    ].join(" ")}
                  >
                    {question.difficulty_level || "medium"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {keywords.length ? (
                    keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-bold text-[#059669]"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-bold text-[#059669]">
                      Chưa có từ khóa
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleQuestion(question.id)}
                  className="hp-btn-secondary mt-4 px-4 py-2 text-sm"
                >
                  {isOpen ? "Ẩn đáp án mẫu" : "Xem đáp án mẫu"}
                </button>

                {isOpen ? (
                  <div className="mt-4 rounded-md bg-[#F0FDF4] p-4">
                    <p className="text-sm font-semibold text-[#059669]">
                      Đáp án mẫu
                    </p>
                    <p className="mt-2 whitespace-pre-line text-slate-900">
                      {question.sample_answer || "Chưa có đáp án mẫu"}
                    </p>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="hp-panel p-8 text-center text-slate-700">
          Chưa có câu hỏi ôn luyện cho đơn hàng này
        </div>
      )}
    </section>
  )
}


