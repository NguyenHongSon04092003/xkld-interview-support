import { BrowserRouter, Route, Routes } from "react-router-dom"

import Footer from "./components/Footer.jsx"
import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import InterviewHistory from "./pages/InterviewHistory.jsx"
import InterviewResult from "./pages/InterviewResult.jsx"
import JobOrderDetail from "./pages/JobOrderDetail.jsx"
import JobOrderList from "./pages/JobOrderList.jsx"
import Login from "./pages/Login.jsx"
import MockInterview from "./pages/MockInterview.jsx"
import PracticeInterview from "./pages/PracticeInterview.jsx"
import Recommendation from "./pages/Recommendation.jsx"
import Register from "./pages/Register.jsx"
import AdminDashboard from "./pages/admin/AdminDashboard.jsx"
import ManageJobOrders from "./pages/consultant/ManageJobOrders.jsx"
import ManageQuestions from "./pages/consultant/ManageQuestions.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<JobOrderList />} />
            <Route path="/jobs/:id" element={<JobOrderDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/practice/:jobId" element={<PracticeInterview />} />
            <Route path="/mock-interview/:jobId" element={<MockInterview />} />
            <Route path="/interview-result/:sessionId" element={<InterviewResult />} />
            <Route path="/interview-history" element={<InterviewHistory />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/consultant/job-orders" element={<ManageJobOrders />} />
            <Route path="/consultant/questions/:jobId" element={<ManageQuestions />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}


