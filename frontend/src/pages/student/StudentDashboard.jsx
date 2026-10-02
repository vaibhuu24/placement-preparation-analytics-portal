import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

import {
  FaGraduationCap,
  FaHome,
  FaUser,
  FaBuilding,
  FaFileAlt,
  FaBrain,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaEnvelope,
  FaIdCard,
  FaBook,
  FaPhone,
  FaCheckCircle,
  FaTrophy,
  FaBullseye,
  FaClipboardCheck,
} from "react-icons/fa";

function StudentDashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Quiz Analytics
  const [quizAnalytics, setQuizAnalytics] = useState({
    total_quizzes_attempted: 0,
    average_score: 0,
    average_accuracy: 0,
    best_score: 0,
  });

  const [recentQuizResults, setRecentQuizResults] = useState([]);

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("student") ||
      sessionStorage.getItem("student");

    if (!savedStudent) {
      navigate("/login");
      return;
    }

    try {
      const studentData = JSON.parse(savedStudent);

      setStudent(studentData);

      fetchQuizAnalytics(studentData.id);
      fetchNotifications(studentData.id);
    } catch (error) {
      console.error("Student data error:", error);

      localStorage.removeItem("student");
      sessionStorage.removeItem("student");

      navigate("/login");
    }
  }, [navigate]);

  // ==========================================
  // FETCH QUIZ ANALYTICS
  // ==========================================

  const fetchQuizAnalytics = async (studentId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/student/quiz-analytics/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("access_token") ||
              sessionStorage.getItem("access_token")
            }`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load quiz analytics."
        );
      }

      setQuizAnalytics(
        data.statistics || {
          total_quizzes_attempted: 0,
          average_score: 0,
          average_accuracy: 0,
          best_score: 0,
        }
      );

      setRecentQuizResults(
        data.recent_results || []
      );
    } catch (error) {
      console.error(
        "QUIZ ANALYTICS ERROR:",
        error
      );
    }
  };

  // ==========================================
  // FETCH STUDENT NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async (studentId) => {
    try {
      setNotificationLoading(true);

      const response = await fetch(
        `http://127.0.0.1:5000/api/notifications/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("access_token") ||
              sessionStorage.getItem("access_token")
            }`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load notifications."
        );
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("NOTIFICATIONS ERROR:", error);
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  // ==========================================
  // MARK NOTIFICATION AS READ
  // ==========================================

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("access_token") ||
              sessionStorage.getItem("access_token")
            }`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update notification."
        );
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: 1 }
            : notification
        )
      );
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
    }
  };

  const unreadNotificationCount = notifications.filter(
    (notification) =>
      notification.is_read === 0 ||
      notification.is_read === false
  ).length;

  const handleNotificationClick = (notification) => {
    if (
      notification.is_read === 0 ||
      notification.is_read === false
    ) {
      markNotificationAsRead(notification.id);
    }
  };

  const handleLogout = () => {
    // Remove student information
    localStorage.removeItem("student");
    sessionStorage.removeItem("student");

    // Remove student JWT token
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");

    // Go back to login page and clear dashboard state
    window.location.replace("/login");
  };

  if (!student) {
    return (
      <div className="student-loading">
        Loading dashboard...
      </div>
    );
  }

  const currentYear = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
    5: "Fifth Year",
  };

  return (
    <div className="student-dashboard">

      {/* MOBILE HEADER */}

      <div className="student-mobile-header">

        <button
          className="student-menu-button"
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        >
          {sidebarOpen ? (
            <FaTimes />
          ) : (
            <FaBars />
          )}
        </button>

        <div className="student-mobile-logo">
          <FaGraduationCap />
          <span>Placement Portal</span>
        </div>

      </div>

      {/* SIDEBAR */}

      <aside
        className={`student-sidebar ${
          sidebarOpen
            ? "student-sidebar-open"
            : ""
        }`}
      >

        <div className="student-sidebar-logo">

          <div className="student-logo-icon">
            <FaGraduationCap />
          </div>

          <div>
            <h2>Placement Portal</h2>
            <span>Student Panel</span>
          </div>

        </div>

        <nav className="student-sidebar-nav">

          <button className="student-nav-item active">
            <FaHome />
            <span>Dashboard</span>
          </button>

          <button
            className="student-nav-item"
            onClick={() => navigate("/student/profile")}
          >
            <FaUser />
            <span>My Profile</span>
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate("/student/companies")
            }
          >
            <FaBuilding />
            <span>Companies</span>
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate("/student/applications")
            }
          >
            <FaFileAlt />
            <span>Applications</span>
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate("/student/quizzes")
            }
          >
            <FaBrain />
            <span>Quizzes</span>
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate("/student/quiz-results")
            }
          >
            <FaChartLine />
            <span>My Performance</span>
          </button>

         

        </nav>

        <button
          className="student-logout-button"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </aside>

      {/* MAIN CONTENT */}

      <main className="student-main">

        {/* TOP BAR */}

        <header className="student-topbar">

          <div>
            <p className="student-page-label">
              Student Dashboard
            </p>

            <h1>
              Welcome back,{" "}
              {student.studentName}
            </h1>

            <p>
              Track your placement preparation
              and career progress.
            </p>
          </div>

          <div className="student-topbar-actions">

            <div className="student-notification-wrapper">
              <button
                className="student-notification-button"
                onClick={() =>
                  setShowNotifications((prev) => !prev)
                }
                title="Notifications"
              >
                <FaBell />

                {unreadNotificationCount > 0 && (
                  <span className="student-notification-count">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="student-notification-dropdown">
                  <div className="student-notification-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>
                        {unreadNotificationCount} unread
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        student &&
                        fetchNotifications(student.id)
                      }
                      title="Refresh"
                    >
                      ↻
                    </button>
                  </div>

                  <div className="student-notification-list">
                    {notificationLoading ? (
                      <div className="student-notification-empty">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="student-notification-empty">
                        <FaBell />
                        <p>No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const isUnread =
                          notification.is_read === 0 ||
                          notification.is_read === false;

                        return (
                          <button
                            type="button"
                            className={`student-notification-item ${
                              isUnread
                                ? "student-notification-unread"
                                : ""
                            }`}
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <div className="student-notification-icon">
                              <FaBell />
                            </div>

                            <div className="student-notification-content">
                              <strong>
                                {notification.title}
                              </strong>

                              <p>
                                {notification.message}
                              </p>

                              <small>
                                {notification.notification_type ||
                                  "General"}
                                {" • "}
                                {notification.created_at
                                  ? new Date(
                                      notification.created_at
                                    ).toLocaleString()
                                  : ""}
                              </small>
                            </div>

                            {isUnread && (
                              <span className="student-notification-dot" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="student-profile-mini">
              <div className="student-avatar">
                {student.studentName
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {student.studentName}
                </strong>

                <span>
                  {student.department}
                </span>
              </div>
            </div>

          </div>

        </header>

        {/* STAT CARDS */}

        <section className="student-stat-grid">

          <div className="student-stat-card">

            <div className="student-stat-icon">
              <FaGraduationCap />
            </div>

            <div>
              <span>CGPA</span>

              <strong>
                {student.cgpa ?? "N/A"}
              </strong>
            </div>

          </div>

          <div className="student-stat-card">

            <div className="student-stat-icon">
              <FaBook />
            </div>

            <div>
              <span>Backlogs</span>

              <strong>
                {student.backlogs ?? 0}
              </strong>
            </div>

          </div>

          <div className="student-stat-card">

            <div className="student-stat-icon">
              <FaChartLine />
            </div>

            <div>
              <span>Current Year</span>

              <strong>
                {currentYear[
                  student.currentYear
                ] ||
                  student.currentYear ||
                  "N/A"}
              </strong>
            </div>

          </div>

          <div className="student-stat-card">

            <div className="student-stat-icon">
              <FaCheckCircle />
            </div>

            <div>
              <span>Placement Status</span>

              <strong>
                {student.placementStatus ||
                  "Unplaced"}
              </strong>
            </div>

          </div>

        </section>

        {/* ==========================================
            QUIZ ANALYTICS
        ========================================== */}

        <section className="student-content-card">

          <div className="student-card-header">

            <div>
              <h2>Quiz Performance</h2>

              <p>
                Track your placement preparation
                performance
              </p>
            </div>

            <button
              className="student-performance-button"
              onClick={() =>
                navigate(
                  "/student/quiz-results"
                )
              }
            >
              View All Results
            </button>

          </div>

          {/* QUIZ STATISTICS */}

          <div className="student-quiz-stat-grid">

            {/* Total Quizzes */}

            <div className="student-quiz-stat-card">

              <div className="student-quiz-stat-icon">
                <FaClipboardCheck />
              </div>

              <div>
                <span>
                  Quizzes Attempted
                </span>

                <strong>
                  {
                    quizAnalytics.total_quizzes_attempted
                  }
                </strong>
              </div>

            </div>

            {/* Average Score */}

            <div className="student-quiz-stat-card">

              <div className="student-quiz-stat-icon">
                <FaChartLine />
              </div>

              <div>
                <span>
                  Average Score
                </span>

                <strong>
                  {Number(
                    quizAnalytics.average_score ||
                      0
                  ).toFixed(2)}
                </strong>
              </div>

            </div>

            {/* Average Accuracy */}

            <div className="student-quiz-stat-card">

              <div className="student-quiz-stat-icon">
                <FaBullseye />
              </div>

              <div>
                <span>
                  Average Accuracy
                </span>

                <strong>
                  {Number(
                    quizAnalytics.average_accuracy ||
                      0
                  ).toFixed(2)}
                  %
                </strong>
              </div>

            </div>

            {/* Best Score */}

            <div className="student-quiz-stat-card">

              <div className="student-quiz-stat-icon">
                <FaTrophy />
              </div>

              <div>
                <span>
                  Best Score
                </span>

                <strong>
                  {Number(
                    quizAnalytics.best_score ||
                      0
                  ).toFixed(2)}
                </strong>
              </div>

            </div>

          </div>

          {/* RECENT RESULTS */}

          <div className="student-recent-results">

            <h3>
              Recent Quiz Results
            </h3>

            {recentQuizResults.length === 0 ? (

              <div className="student-no-results">

                <span>📊</span>

                <p>
                  No quiz attempts yet.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/student/quizzes"
                    )
                  }
                >
                  Take Your First Quiz
                </button>

              </div>

            ) : (

              <div className="student-recent-results-list">

                {recentQuizResults.map(
                  (result) => (

                    <div
                      className="student-recent-result-item"
                      key={result.id}
                    >

                      <div>
                        <strong>
                          {result.quiz_title}
                        </strong>

                        <span>
                          {result.category}
                        </span>
                      </div>

                      <div className="student-recent-score">

                        <strong>
                          {Number(
                            result.score || 0
                          ).toFixed(2)}
                          {" / "}
                          {Number(
                            result.total_marks ||
                              0
                          ).toFixed(2)}
                        </strong>

                        <span>
                          {Number(
                            result.accuracy || 0
                          ).toFixed(2)}
                          % Accuracy
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>

        {/* PROFILE */}

        <section className="student-content-card">

          <div className="student-card-header">

            <div>
              <h2>My Profile</h2>

              <p>
                Your registered academic information
              </p>
            </div>

            <div className="student-status-badge">
              <FaCheckCircle />

              {student.placementStatus ||
                "Unplaced"}
            </div>

          </div>

          <div className="student-profile-grid">

            <ProfileItem
              icon={<FaUser />}
              label="Student Name"
              value={student.studentName}
            />

            <ProfileItem
              icon={<FaEnvelope />}
              label="College Email"
              value={student.email}
            />

            <ProfileItem
              icon={<FaIdCard />}
              label="Roll Number"
              value={student.rollNumber}
            />

            <ProfileItem
              icon={<FaIdCard />}
              label="PRN"
              value={
                student.prn || "N/A"
              }
            />

            <ProfileItem
              icon={<FaGraduationCap />}
              label="Department"
              value={student.department}
            />

            <ProfileItem
              icon={<FaBook />}
              label="Branch"
              value={student.branch}
            />

            <ProfileItem
              icon={<FaGraduationCap />}
              label="Current Year"
              value={
                currentYear[
                  student.currentYear
                ] ||
                student.currentYear
              }
            />

            <ProfileItem
              icon={<FaChartLine />}
              label="CGPA"
              value={
                student.cgpa ?? "N/A"
              }
            />

            <ProfileItem
              icon={<FaBook />}
              label="Backlogs"
              value={
                student.backlogs ?? 0
              }
            />

            <ProfileItem
              icon={<FaPhone />}
              label="Phone Number"
              value={student.phone}
            />

          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="student-content-card">

          <div className="student-card-header">

            <div>
              <h2>Quick Actions</h2>

              <p>
                Continue your placement preparation
              </p>
            </div>

          </div>

          <div className="student-quick-grid">

            <button
              className="student-quick-card"
              onClick={() =>
                navigate(
                  "/student/companies"
                )
              }
            >
              <FaBuilding />

              <strong>
                Explore Companies
              </strong>

              <span>
                View available opportunities
              </span>
            </button>

            <button
              className="student-quick-card"
              onClick={() =>
                navigate(
                  "/student/applications"
                )
              }
            >
              <FaFileAlt />

              <strong>
                My Applications
              </strong>

              <span>
                Track your applications
              </span>
            </button>

            <button
              className="student-quick-card"
              onClick={() =>
                navigate(
                  "/student/quizzes"
                )
              }
            >
              <FaBrain />

              <strong>
                Take Quiz
              </strong>

              <span>
                Test your placement skills
              </span>
            </button>

            <button
              className="student-quick-card"
              onClick={() =>
                navigate(
                  "/student/quiz-results"
                )
              }
            >
              <FaChartLine />

              <strong>
                View Performance
              </strong>

              <span>
                Check your preparation progress
              </span>
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}


/* ============================================================
   PROFILE ITEM
============================================================ */

function ProfileItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="student-profile-item">

      <div className="student-profile-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>
          {value || "N/A"}
        </strong>
      </div>

    </div>
  );
}

export default StudentDashboard;