import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import faceDetectionScriptUrl from "@mediapipe/face_detection/face_detection.js?url"
import faceDetectionFullBinary from "@mediapipe/face_detection/face_detection_full.binarypb?url"
import faceDetectionFullRangeModel from "@mediapipe/face_detection/face_detection_full_range.tflite?url"
import faceDetectionFullRangeSparseModel from "@mediapipe/face_detection/face_detection_full_range_sparse.tflite?url"
import faceDetectionShortBinary from "@mediapipe/face_detection/face_detection_short.binarypb?url"
import faceDetectionShortRangeModel from "@mediapipe/face_detection/face_detection_short_range.tflite?url"
import faceDetectionSimdData from "@mediapipe/face_detection/face_detection_solution_simd_wasm_bin.data?url"
import faceDetectionSimdJs from "@mediapipe/face_detection/face_detection_solution_simd_wasm_bin.js?url"
import faceDetectionSimdWasm from "@mediapipe/face_detection/face_detection_solution_simd_wasm_bin.wasm?url"
import faceDetectionWasmJs from "@mediapipe/face_detection/face_detection_solution_wasm_bin.js?url"
import faceDetectionWasm from "@mediapipe/face_detection/face_detection_solution_wasm_bin.wasm?url"

import api from "../services/api.js"

const ANSWER_TIME_LIMIT = 60
const DEFAULT_BEHAVIOR_SCORE = 75
const MEDIAPIPE_FILES = {
  "face_detection_full.binarypb": faceDetectionFullBinary,
  "face_detection_full_range.tflite": faceDetectionFullRangeModel,
  "face_detection_full_range_sparse.tflite": faceDetectionFullRangeSparseModel,
  "face_detection_short.binarypb": faceDetectionShortBinary,
  "face_detection_short_range.tflite": faceDetectionShortRangeModel,
  "face_detection_solution_simd_wasm_bin.data": faceDetectionSimdData,
  "face_detection_solution_simd_wasm_bin.js": faceDetectionSimdJs,
  "face_detection_solution_simd_wasm_bin.wasm": faceDetectionSimdWasm,
  "face_detection_solution_wasm_bin.js": faceDetectionWasmJs,
  "face_detection_solution_wasm_bin.wasm": faceDetectionWasm,
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

function getSpeechErrorMessage(errorCode) {
  const messages = {
    "not-allowed": "Vui lòng cấp quyền microphone",
    "no-speech": "Không nhận được giọng nói, thử lại",
    network: "Lỗi mạng, kiểm tra kết nối",
  }

  return messages[errorCode] || "Không thể nhận diện giọng nói"
}

function shuffleQuestions(questions) {
  const shuffledQuestions = [...questions]

  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentQuestion = shuffledQuestions[index]
    shuffledQuestions[index] = shuffledQuestions[randomIndex]
    shuffledQuestions[randomIndex] = currentQuestion
  }

  return shuffledQuestions
}

function loadMediaPipeFaceDetectionScript() {
  if (window.FaceDetection) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      "script[data-mediapipe-face-detection]",
    )

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true })
      existingScript.addEventListener("error", reject, { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = faceDetectionScriptUrl
    script.async = true
    script.dataset.mediapipeFaceDetection = "true"
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function MockInterview() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const faceDetectionRef = useRef(null)
  const behaviorIntervalRef = useRef(null)
  const behaviorLogsRef = useRef([])
  const latestBehaviorRef = useRef({
    face_detected: false,
    face_centered: false,
  })
  const finalTranscriptRef = useRef("")
  const interimTranscriptRef = useRef("")
  const manualTranscriptRef = useRef("")
  const answersRef = useRef([])
  const shouldRestartRecognitionRef = useRef(false)

  const [jobOrder, setJobOrder] = useState(null)
  const [questions, setQuestions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [finalTranscript, setFinalTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [manualTranscript, setManualTranscript] = useState("")
  const [answers, setAnswers] = useState([])
  const [isManualMode, setIsManualMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [savedQuestionIds, setSavedQuestionIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [speechWarning, setSpeechWarning] = useState("")
  const [cameraWarning, setCameraWarning] = useState("")
  const [cameraStatus, setCameraStatus] = useState("Đang xin quyền camera")
  const [timeLimitWarning, setTimeLimitWarning] = useState("")
  const [mediaPipeWarning, setMediaPipeWarning] = useState("")
  const [temporarySaveMessage, setTemporarySaveMessage] = useState("")
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceCentered, setFaceCentered] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= questions.length - 1
  const currentQuestionSaved = currentQuestion
    ? savedQuestionIds.includes(currentQuestion.id)
    : false
  const displayedQuestionNumber = questions.length ? currentQuestionIndex + 1 : 0
  const progressPercent = questions.length
    ? Math.round((displayedQuestionNumber / questions.length) * 100)
    : 0

  useEffect(() => {
    finalTranscriptRef.current = finalTranscript
  }, [finalTranscript])

  useEffect(() => {
    interimTranscriptRef.current = interimTranscript
  }, [interimTranscript])

  useEffect(() => {
    manualTranscriptRef.current = manualTranscript
  }, [manualTranscript])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    let timerId

    if (isRecording) {
      timerId = window.setInterval(() => {
        setElapsedSeconds((current) => {
          const next = current + 1

          if (next >= ANSWER_TIME_LIMIT) {
            window.clearInterval(timerId)
            setTimeLimitWarning("Đã đạt giới hạn thời gian")
            stopAnswer()
          }

          return Math.min(next, ANSWER_TIME_LIMIT)
        })
      }, 1000)
    }

    return () => {
      if (timerId) {
        window.clearInterval(timerId)
      }
    }
  }, [isRecording])

  useEffect(() => {
    let isMounted = true

    async function initializeInterview() {
      try {
        setIsLoading(true)
        setErrorMessage("")

        const candidateId = await getCandidateId()
        if (!candidateId) {
          throw new Error("Missing candidate id")
        }

        const [jobResponse, questionsResponse] = await Promise.all([
          api.get(`/job-orders/${jobId}`),
          api.get(`/interview-questions/${jobId}`),
        ])

        const sessionResponse = await api.post("/mock-interviews/sessions", {
          candidate_id: Number(candidateId),
          job_order_id: Number(jobId),
        })

        if (isMounted) {
          setJobOrder(jobResponse.data)
          setQuestions(shuffleQuestions(questionsResponse.data))
          setSessionId(sessionResponse.data.id)
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Không thể khởi tạo buổi phỏng vấn")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCameraStatus("Camera đã bật")
          setupMediaPipe()
        }
      } catch {
        if (isMounted) {
          setCameraWarning("Không thể mở camera. Bạn vẫn có thể phỏng vấn bằng text.")
          setCameraStatus("Camera chưa bật")
        }
      }
    }

    initializeInterview()
    setupMedia()
    setupSpeechRecognition()

    return () => {
      isMounted = false
      shouldRestartRecognitionRef.current = false
      stopBehaviorTracking()
      stopRecognition()
      stopMediaStream()
    }
  }, [jobId])

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

  function setupSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechWarning("Trình duyệt không hỗ trợ Speech API.")
      setIsManualMode(true)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "vi-VN"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalText = ""
      let interimText = ""

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result[0].transcript

        if (result.isFinal) {
          finalText += `${text} `
        } else {
          interimText += text
        }
      }

      if (finalText) {
        setFinalTranscript((current) => `${current}${finalText}`)
      }
      setInterimTranscript(interimText)
    }

    recognition.onerror = (event) => {
      if (event.error === "aborted" && shouldRestartRecognitionRef.current) {
        restartRecognition()
        return
      }

      setSpeechWarning(getSpeechErrorMessage(event.error))

      if (event.error === "not-allowed" || event.error === "network") {
        setIsManualMode(true)
      }

      if (event.error !== "no-speech") {
        setIsRecording(false)
      }
    }

    recognition.onend = () => {
      if (shouldRestartRecognitionRef.current) {
        restartRecognition()
        return
      }

      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }

  async function setupMediaPipe() {
    try {
      await loadMediaPipeFaceDetectionScript()

      if (!window.FaceDetection) {
        throw new Error("FaceDetection is not available")
      }

      const faceDetection = new window.FaceDetection({
        locateFile: (file) => MEDIAPIPE_FILES[file] || file,
      })

      faceDetection.setOptions({
        model: "short",
        minDetectionConfidence: 0.5,
      })

      faceDetection.onResults(handleFaceDetectionResults)
      faceDetectionRef.current = faceDetection
      setMediaPipeWarning("")
      setCameraStatus("Camera đã bật, đang theo dõi tác phong")
    } catch {
      setMediaPipeWarning("Không thể theo dõi tác phong. Điểm tác phong mặc định là 75.")
      setCameraStatus("Camera đã bật, chưa theo dõi được tác phong")
    }
  }

  function handleFaceDetectionResults(results) {
    const detection = results.detections?.[0]
    const face_detected = Boolean(detection)
    const face_centered = face_detected ? isFaceCentered(detection) : false

    latestBehaviorRef.current = {
      face_detected,
      face_centered,
    }
    setFaceDetected(face_detected)
    setFaceCentered(face_centered)
  }

  function isFaceCentered(detection) {
    const boundingBox =
      detection.boundingBox || detection.locationData?.relativeBoundingBox

    if (!boundingBox) {
      return false
    }

    const centerX =
      boundingBox.xCenter ??
      boundingBox.xMin + boundingBox.width / 2
    const centerY =
      boundingBox.yCenter ??
      boundingBox.yMin + boundingBox.height / 2

    return centerX >= 0.35 && centerX <= 0.65 && centerY >= 0.25 && centerY <= 0.75
  }

  function startBehaviorTracking() {
    stopBehaviorTracking()
    behaviorLogsRef.current = []
    latestBehaviorRef.current = {
      face_detected: false,
      face_centered: false,
    }

    if (!faceDetectionRef.current) {
      setMediaPipeWarning("Không thể theo dõi tác phong. Điểm tác phong mặc định là 75.")
      return
    }

    behaviorIntervalRef.current = window.setInterval(async () => {
      try {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await faceDetectionRef.current.send({ image: videoRef.current })
        }

        behaviorLogsRef.current.push({
          timestamp: Date.now(),
          face_detected: latestBehaviorRef.current.face_detected,
          face_centered: latestBehaviorRef.current.face_centered,
        })
      } catch {
        setMediaPipeWarning("Không thể theo dõi tác phong. Điểm tác phong mặc định là 75.")
      }
    }, 1000)
  }

  function stopBehaviorTracking() {
    if (behaviorIntervalRef.current) {
      window.clearInterval(behaviorIntervalRef.current)
      behaviorIntervalRef.current = null
    }
  }

  function calculateBehaviorScore() {
    const logs = behaviorLogsRef.current

    if (!faceDetectionRef.current || logs.length === 0) {
      return DEFAULT_BEHAVIOR_SCORE
    }

    const faceDetectedCount = logs.filter((log) => log.face_detected).length
    const faceCenteredCount = logs.filter((log) => log.face_centered).length
    const facePresenceScore = (faceDetectedCount / logs.length) * 100
    const focusScore = (faceCenteredCount / logs.length) * 100

    return Math.round(facePresenceScore * 0.6 + focusScore * 0.4)
  }

  function calculateTotalBehaviorScore(sourceAnswers = answersRef.current) {
    if (!sourceAnswers.length) {
      return DEFAULT_BEHAVIOR_SCORE
    }

    const total = sourceAnswers.reduce(
      (sum, answer) => sum + Number(answer.behavior_score || 0),
      0,
    )

    return Math.round(total / sourceAnswers.length)
  }

  function upsertAnswer(answerRecord) {
    setAnswers((current) => {
      const next = current.some(
        (answer) => answer.question_id === answerRecord.question_id,
      )
        ? current.map((answer) =>
            answer.question_id === answerRecord.question_id
              ? answerRecord
              : answer,
          )
        : [...current, answerRecord]

      answersRef.current = next
      return next
    })
  }

  function savePendingAnswer(answerRecord) {
    if (!sessionId) {
      return
    }

    const storageKey = `interview_pending_answers_${sessionId}`
    const existingAnswers = JSON.parse(localStorage.getItem(storageKey) || "[]")
    const nextAnswers = [
      ...existingAnswers.filter(
        (answer) => answer.question_id !== answerRecord.question_id,
      ),
      answerRecord,
    ]

    localStorage.setItem(storageKey, JSON.stringify(nextAnswers))
    setTemporarySaveMessage("Đã lưu tạm, sẽ đồng bộ sau")
  }

  function restartRecognition() {
    window.setTimeout(() => {
      if (!shouldRestartRecognitionRef.current || !recognitionRef.current) {
        return
      }

      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch {
        setSpeechWarning("Không thể khởi động lại microphone")
        setIsRecording(false)
      }
    }, 300)
  }

  function stopRecognition() {
    try {
      recognitionRef.current.stop()
    } catch {
      // SpeechRecognition throws when it is already stopped.
    }
  }

  function stopMediaStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  function resetAnswerState() {
    setFinalTranscript("")
    setInterimTranscript("")
    setManualTranscript("")
    finalTranscriptRef.current = ""
    interimTranscriptRef.current = ""
    manualTranscriptRef.current = ""
    setElapsedSeconds(0)
    setTimeLimitWarning("")
    behaviorLogsRef.current = []
  }

  function startAnswer() {
    setErrorMessage("")
    setSpeechWarning("")
    setTemporarySaveMessage("")
    resetAnswerState()
    startBehaviorTracking()

    if (isManualMode) {
      setIsRecording(true)
      return
    }

    if (!recognitionRef.current) {
      setSpeechWarning("Trình duyệt không hỗ trợ Speech API. Hãy nhập tay.")
      setIsManualMode(true)
      setIsRecording(true)
      return
    }

    try {
      shouldRestartRecognitionRef.current = true
      recognitionRef.current.start()
      setIsRecording(true)
    } catch {
      setSpeechWarning("Micro đang được sử dụng. Hãy thử lại.")
    }
  }

  async function stopAnswer() {
    if (isRecording && !isManualMode) {
      shouldRestartRecognitionRef.current = false
      setIsRecording(false)
      stopBehaviorTracking()
      stopRecognition()
      await saveCurrentAnswer()
      return
    }

    setIsRecording(false)
    stopBehaviorTracking()
    await saveCurrentAnswer()
  }

  async function saveCurrentAnswer() {
    if (!sessionId || !currentQuestion) {
      return null
    }

    const answerText = isManualMode
      ? manualTranscriptRef.current.trim()
      : `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim()
    const behaviorScore = calculateBehaviorScore()
    const answerRecord = {
      question_id: currentQuestion.id,
      answer_text: answerText,
      behavior_score: behaviorScore,
      time_taken: elapsedSeconds,
    }

    upsertAnswer(answerRecord)

    try {
      setIsSaving(true)
      await api.post("/mock-interviews/answers", {
        session_id: sessionId,
        question_id: currentQuestion.id,
        answer_text: answerText,
        audio_url: null,
        behavior_score: behaviorScore,
        time_taken: elapsedSeconds,
      })
      setTemporarySaveMessage("")
      setSavedQuestionIds((current) =>
        current.includes(currentQuestion.id)
          ? current
          : [...current, currentQuestion.id],
      )
      return answerRecord
    } catch {
      savePendingAnswer(answerRecord)
      setSavedQuestionIds((current) =>
        current.includes(currentQuestion.id)
          ? current
          : [...current, currentQuestion.id],
      )
      return answerRecord
    } finally {
      setIsSaving(false)
    }
  }

  function goToNextQuestion() {
    if (!isLastQuestion && !isSaving) {
      shouldRestartRecognitionRef.current = false
      stopRecognition()
      stopBehaviorTracking()
      setIsRecording(false)
      setCurrentQuestionIndex((current) => current + 1)
      resetAnswerState()
    }
  }

  async function finishInterview() {
    if (!sessionId) {
      return
    }

    try {
      setIsSaving(true)
      if (isRecording) {
        shouldRestartRecognitionRef.current = false
        stopRecognition()
        stopBehaviorTracking()
        setIsRecording(false)
        await saveCurrentAnswer()
      }

      const finalAnswers = answersRef.current
      const totalBehaviorScore = calculateTotalBehaviorScore(finalAnswers)

      localStorage.setItem(
        `interview_answers_${sessionId}`,
        JSON.stringify(finalAnswers),
      )

      await api.put(`/mock-interviews/sessions/${sessionId}/finish`, {
        behavior_score: totalBehaviorScore,
      })
      navigate(`/interview-result/${sessionId}`)
    } catch {
      setErrorMessage("Không thể kết thúc buổi phỏng vấn")
    } finally {
      setIsSaving(false)
    }
  }

  function toggleManualMode() {
    shouldRestartRecognitionRef.current = false
    stopRecognition()
    stopBehaviorTracking()
    setIsRecording(false)
    setIsManualMode((current) => !current)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-[#059669]" />
      </div>
    )
  }

  if (errorMessage && !sessionId) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-red-700">
        {errorMessage}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="hp-page-heading">
        <p className="hp-eyebrow">
          Phỏng vấn thử
        </p>
        <h1 className="hp-title">
          {jobOrder?.job_name || "Buổi phỏng vấn"}
        </h1>
        <p className="hp-subtitle">
          Trả lời từng câu, bấm dừng để lưu câu trả lời, sau đó chuyển sang câu tiếp theo.
        </p>
      </div>

      {speechWarning ? (
        <div className="rounded-md bg-yellow-50 px-4 py-3 text-yellow-700">
          {speechWarning}
        </div>
      ) : null}

      {cameraWarning ? (
        <div className="rounded-md bg-yellow-50 px-4 py-3 text-yellow-700">
          {cameraWarning}
        </div>
      ) : null}

      {mediaPipeWarning ? (
        <div className="rounded-md bg-yellow-50 px-4 py-3 text-yellow-700">
          {mediaPipeWarning}
        </div>
      ) : null}

      {timeLimitWarning ? (
        <div className="rounded-md bg-yellow-50 px-4 py-3 text-yellow-700">
          {timeLimitWarning}
        </div>
      ) : null}

      {temporarySaveMessage ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-[#047857]">
          {temporarySaveMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="hp-panel p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#064E3B]">
          <span>Tiến độ</span>
          <span>
            Câu hỏi {displayedQuestionNumber}/{questions.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#BBF7D0]">
          <div
            className="h-full rounded-full bg-[#F28C28] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="hp-panel space-y-3 p-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded-lg bg-[#064E3B] object-cover"
          />
          <div
            className={[
              "rounded-md px-4 py-3 text-sm font-semibold",
              mediaPipeWarning
                ? "bg-yellow-50 text-yellow-700"
                : faceDetected
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700",
            ].join(" ")}
          >
            {mediaPipeWarning
              ? "Không thể theo dõi tác phong"
              : faceDetected
              ? `Khuôn mặt trong khung${faceCentered ? "" : " - hãy nhìn thẳng hơn"}`
              : "Vui lòng nhìn vào camera"}
          </div>
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#047857]">
            {cameraStatus}
          </div>
        </div>

        <div className="hp-panel space-y-4 p-5">
          <div>
              <p className="text-sm font-bold text-[#059669]">
              Câu hỏi {displayedQuestionNumber}/{questions.length}
            </p>
              <h2 className="mt-2 text-xl font-black text-[#064E3B]">
              {currentQuestion?.question_content || "Chưa có câu hỏi"}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-[#ECFDF5] p-4">
              <p className="text-sm font-semibold text-[#047857]">Thời gian</p>
              <p className="mt-1 text-2xl font-bold text-[#064E3B]">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div className="rounded-md bg-[#ECFDF5] p-4">
              <p className="text-sm font-semibold text-[#047857]">Micro</p>
              <StatusIndicator
                isRecording={isRecording}
                isSaved={currentQuestionSaved}
              />
            </div>
            <div className="rounded-md bg-[#ECFDF5] p-4">
              <p className="text-sm font-semibold text-[#047857]">Chế độ</p>
              <button
                type="button"
                onClick={toggleManualMode}
                className="hp-btn-secondary mt-2 px-3 py-2 text-sm"
              >
                {isManualMode ? "Dùng giọng nói" : "Nhập tay"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-[#064E3B]">
              Nội dung trả lời
            </span>

            {isManualMode ? (
              <textarea
                value={manualTranscript}
                onChange={(event) => setManualTranscript(event.target.value)}
                rows="8"
                className="hp-input"
                placeholder="Nhập câu trả lời tại đây"
              />
            ) : (
              <div className="min-h-44 rounded-md border border-[#BBF7D0] bg-white px-3 py-2">
                <p className="whitespace-pre-wrap font-semibold text-[#064E3B]">
                  {finalTranscript || "Kết quả cuối sẽ hiển thị tại đây"}
                </p>
                {interimTranscript ? (
                  <p className="mt-2 whitespace-pre-wrap italic text-slate-400">
                    {interimTranscript}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startAnswer}
              disabled={(isRecording && !isManualMode) || !currentQuestion}
              className="hp-btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              Bắt đầu trả lời
            </button>
            <button
              type="button"
              onClick={stopAnswer}
              disabled={(!isRecording && !isManualMode) || isSaving}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              Dừng trả lời
            </button>
            <button
              type="button"
              onClick={goToNextQuestion}
              disabled={isLastQuestion || isRecording || isSaving}
              className="hp-btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-emerald-50 disabled:text-emerald-300"
            >
              Câu tiếp theo
            </button>
            <button
              type="button"
              onClick={finishInterview}
              disabled={isSaving}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              Kết thúc
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatusIndicator({ isRecording, isSaved }) {
  if (isRecording) {
    return (
      <p className="mt-2 flex items-center gap-2 text-lg font-bold text-[#064E3B]">
        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
        Đang ghi âm
      </p>
    )
  }

  if (isSaved) {
    return (
      <p className="mt-2 flex items-center gap-2 text-lg font-bold text-[#064E3B]">
        <span className="h-3 w-3 rounded-full bg-green-500" />
        Đã lưu câu trả lời
      </p>
    )
  }

  return (
    <p className="mt-2 flex items-center gap-2 text-lg font-bold text-[#064E3B]">
      <span className="h-3 w-3 rounded-full bg-slate-300" />
      Chưa ghi âm
    </p>
  )
}


