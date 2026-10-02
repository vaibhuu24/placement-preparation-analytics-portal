import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentQuizResults() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");

      const studentData =
        localStorage.getItem("student") ||
        sessionStorage.getItem("student");

      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!studentData || !token) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        navigate("/login", { replace: true });
        return;
      }

      let student;

      try {
        student = JSON.parse(studentData);
      } catch (error) {
        console.error("STUDENT DATA ERROR:", error);

        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        navigate("/login", { replace: true });
        return;
      }

      /*
       * Change this endpoint only if your Flask backend
       * uses a different route for student quiz results.
       */
      const response = await fetch(
        `http://127.0.0.1:5000/api/student/quiz-results/${student.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load quiz results."
        );
      }

      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("QUIZ RESULTS ERROR:", error);
      setError(error.message || "Failed to load quiz results.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("student");
    sessionStorage.removeItem("student");
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");

    window.location.replace("/login");
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>
          <h2>Loading Quiz Results...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>Quiz Results</h1>
          <p style={subHeadingStyle}>
            View your quiz performance and scores
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            style={secondaryButtonStyle}
            onClick={() => navigate("/student/quizzes")}
          >
            ← Quizzes
          </button>

          <button
            style={logoutButtonStyle}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}

          <button
            style={retryButtonStyle}
            onClick={fetchResults}
          >
            Retry
          </button>
        </div>
      )}

      {/* No Results */}
      {!error && results.length === 0 && (
        <div style={messageStyle}>
          <h2>No Quiz Results</h2>

          <p>
            You have not completed any quizzes yet.
          </p>

          <button
            style={primaryButtonStyle}
            onClick={() => navigate("/student/quizzes")}
          >
            Take a Quiz
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={resultsContainerStyle}>
          {results.map((result, index) => (
            <div
              key={result.id || index}
              style={resultCardStyle}
            >
              <div style={resultHeaderStyle}>
                <div>
                  <h2 style={quizTitleStyle}>
                    {result.quiz_title ||
                      result.title ||
                      `Quiz ${index + 1}`}
                  </h2>

                  <p style={dateStyle}>
                    {result.created_at
                      ? new Date(
                          result.created_at
                        ).toLocaleString()
                      : "Completed"}
                  </p>
                </div>

                <div style={scoreStyle}>
                  {result.score ?? 0}
                  <span style={totalMarksStyle}>
                    {" "}
                    / {result.total_marks ?? 0}
                  </span>
                </div>
              </div>

              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <strong>
                    {result.accuracy ?? 0}%
                  </strong>
                  <span>Accuracy</span>
                </div>

                <div style={statCardStyle}>
                  <strong>
                    {result.correct_answers ?? 0}
                  </strong>
                  <span>Correct</span>
                </div>

                <div style={statCardStyle}>
                  <strong>
                    {result.wrong_answers ?? 0}
                  </strong>
                  <span>Wrong</span>
                </div>

                <div style={statCardStyle}>
                  <strong>
                    {result.unanswered ?? 0}
                  </strong>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div style={bottomActionsStyle}>
        <button
          style={secondaryButtonStyle}
          onClick={fetchResults}
        >
          🔄 Refresh Results
        </button>
      </div>
    </div>
  );
}

/* =========================
   Styles
========================= */

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "30px",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const headingStyle = {
  margin: 0,
  fontSize: "30px",
  color: "#111827",
};

const subHeadingStyle = {
  marginTop: "8px",
  color: "#6b7280",
};

const loadingStyle = {
  maxWidth: "600px",
  margin: "100px auto",
  background: "#fff",
  padding: "40px",
  borderRadius: "12px",
  textAlign: "center",
};

const messageStyle = {
  maxWidth: "600px",
  margin: "80px auto",
  background: "#fff",
  padding: "40px",
  borderRadius: "12px",
  textAlign: "center",
  boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
};

const resultsContainerStyle = {
  display: "grid",
  gap: "20px",
};

const resultCardStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
};

const resultHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const quizTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "21px",
};

const dateStyle = {
  marginTop: "7px",
  color: "#6b7280",
  fontSize: "14px",
};

const scoreStyle = {
  fontSize: "30px",
  fontWeight: "700",
  color: "#2563eb",
};

const totalMarksStyle = {
  fontSize: "18px",
  color: "#6b7280",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "15px",
};

const statCardStyle = {
  background: "#f5f7fb",
  padding: "16px",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  textAlign: "center",
};

const primaryButtonStyle = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "12px 22px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const logoutButtonStyle = {
  border: "none",
  background: "#dc2626",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const bottomActionsStyle = {
  marginTop: "25px",
  textAlign: "center",
};

const errorStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "15px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const retryButtonStyle = {
  marginLeft: "15px",
  border: "none",
  background: "#991b1b",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
};

export default StudentQuizResults;