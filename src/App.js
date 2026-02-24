import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import ElphiChatWidget from "./components/ElphiChatWidget";

import SemestersSidebar from "./components/SemestersSidebar";
import VideoSection from "./components/VideoSection";
import NotesSection from "./components/NotesSection";
import CalendarAndTasks from "./components/CalendarAndTasks";
import StudyRooms from "./components/StudyRooms";

import "./styles/global.css";

/* ===================== DASHBOARD LAYOUT ===================== */
function DashboardLayout({ setIsLoggedIn }) {
  const [activeSubject, setActiveSubject] = useState('Core Subject 1A');

  return (
    <>
      <Header setIsLoggedIn={setIsLoggedIn} />
      <div className="app-container">
        <SemestersSidebar setActiveSubject={setActiveSubject} />
        <main className="main-content">
          <VideoSection subject={activeSubject} />
          <NotesSection subject={activeSubject} />
        </main>
        <aside className="right-sidebar">
          <CalendarAndTasks />
          <StudyRooms />
        </aside>
      </div>
    </>
  );
}

/* ===================== PROFILE LAYOUT ===================== */
function ProfileLayout({ setIsLoggedIn }) {
  return (
    <>
      <Header setIsLoggedIn={setIsLoggedIn} />
      <Profile />
    </>
  );
}

/* ===================== MAIN APP ===================== */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login on app load
  useEffect(() => {
    const user = localStorage.getItem("elphiUser");
    setIsLoggedIn(!!user);
  }, []);

  return (
    <Router>
      <Routes>

        {/* ===================== HOME (PUBLIC) ===================== */}
        <Route path="/" element={<Home />} />

        {/* ===================== LOGIN ===================== */}
        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <Login setIsLoggedIn={setIsLoggedIn} />
          }
        />

        {/* ===================== SIGNUP ===================== */}
        <Route
          path="/signup"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <Signup setIsLoggedIn={setIsLoggedIn} />
          }
        />

        {/* ===================== DASHBOARD (PROTECTED) ===================== */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn
              ? <DashboardLayout setIsLoggedIn={setIsLoggedIn} />
              : <Navigate to="/login" replace />
          }
        />

        {/* ===================== PROFILE (PROTECTED) ===================== */}
        <Route
          path="/profile"
          element={
            isLoggedIn
              ? <ProfileLayout setIsLoggedIn={setIsLoggedIn} />
              : <Navigate to="/login" replace />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

      {/* Chat widget always visible */}
      <ElphiChatWidget />
    </Router>
  );
}

export default App;