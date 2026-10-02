import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Applications.css";

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState(null);

  const getToken = () =>
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  const loadApplications = useCallback(
    async (studentId, isRefresh = false) => {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          `http://127.0.0.1:5000/api/applications/student/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // JWT expired or invalid
        if (response.status === 401) {
          localStorage.removeItem("student");
          sessionStorage.removeItem("student");

          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");

          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        const data = await response.json();

        setApplications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Applications error:", error);

        if (!isRefresh) {
          setApplications([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const storedStudent =
      localStorage.getItem("student") ||
      sessionStorage.getItem("student");

    if (!storedStudent) {
      navigate("/login");
      return;
    }

    try {
      const loggedInStudent = JSON.parse(storedStudent);

      setStudent(loggedInStudent);

      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      loadApplications(loggedInStudent.id);
    } catch (error) {
      console.error("Invalid student data:", error);

      localStorage.removeItem("student");
      sessionStorage.removeItem("student");

      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");

      navigate("/login");
    }
  }, [navigate, loadApplications]);

  const handleRefresh = () => {
    if (student?.id) {
      loadApplications(student.id, true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("student");
    sessionStorage.removeItem("student");

    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");

    window.location.replace("/login");
  };

  const appliedCount = applications.filter(
    (app) => app.status === "Applied"
  ).length;

  const shortlistedCount = applications.filter(
    (app) => app.status === "Shortlisted"
  ).length;

  const selectedCount = applications.filter(
    (app) => app.status === "Selected"
  ).length;

  const rejectedCount = applications.filter(
    (app) => app.status === "Rejected"
  ).length;

  const getStatusClass = (status) => {
    if (!status) return "applied";

    return status.toLowerCase().replace(/\s+/g, "-");
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Not available";
    }
  };

  if (!student) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="student-applications-page">
      <aside className="student-applications-sidebar">
        <div className="sidebar-logo">
          <h2>Placement Portal</h2>
          <p>Student Panel</p>
        </div>

        <nav>
          <button onClick={() => navigate("/student/dashboard")}>
            📊 Dashboard
          </button>

          <button onClick={() => navigate("/student/profile")}>
            👤 My Profile
          </button>

          <button onClick={() => navigate("/student/companies")}>
            🏢 Companies
          </button>

          <button className="active">
            📝 Applications
          </button>

          <button onClick={() => navigate("/student/quizzes")}>
            🧠 Quizzes
          </button>

          <button onClick={() => navigate("/student/quiz-results")}>
            📈 My Performance
          </button>
        </nav>

        <button className="applications-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="student-applications-main">
        <header className="applications-header">
          <div>
            <h1>My Applications</h1>
            <p>
              Track your placement applications and their current status.
            </p>
          </div>

          <div className="student-mini-profile">
            <div className="student-avatar">
              {student.studentName?.charAt(0)?.toUpperCase() || "S"}
            </div>

            <div>
              <strong>{student.studentName || "Student"}</strong>
              <span>{student.department || "Department"}</span>
            </div>
          </div>
        </header>

        <div className="applications-summary">
          <div className="application-summary-card">
            <span>Total Applications</span>
            <strong>{applications.length}</strong>
          </div>

          <div className="application-summary-card">
            <span>Applied</span>
            <strong>{appliedCount}</strong>
          </div>

          <div className="application-summary-card">
            <span>Shortlisted</span>
            <strong>{shortlistedCount}</strong>
          </div>

          <div className="application-summary-card">
            <span>Selected</span>
            <strong>{selectedCount}</strong>
          </div>

          <div className="application-summary-card">
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>

        <section className="applications-section">

          {/* Refresh */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "15px",
            }}
          >
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: refreshing ? "not-allowed" : "pointer",
              }}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="applications-loading">
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="no-applications">
              <div className="no-application-icon">📝</div>

              <h2>No Applications Yet</h2>

              <p>You have not applied to any company yet.</p>

              <button onClick={() => navigate("/student/companies")}>
                Browse Companies
              </button>
            </div>
          ) : (
            <div className="applications-table-container">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Package</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <strong>
                          {application.company_name || "Company"}
                        </strong>
                      </td>

                      <td>
                        {application.role || "Job Opportunity"}
                      </td>

                      <td>
                        {application.package_lpa
                          ? `${application.package_lpa} LPA`
                          : "Not specified"}
                      </td>

                      <td>
                        {formatDate(application.applied_at)}
                      </td>

                      <td>
                        <span
                          className={`application-status ${getStatusClass(
                            application.status
                          )}`}
                        >
                          {application.status || "Applied"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Applications;