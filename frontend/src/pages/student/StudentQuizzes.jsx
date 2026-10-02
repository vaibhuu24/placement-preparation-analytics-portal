import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/admin/quizzes",
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
        throw new Error(data.error || "Failed to load quizzes.");
      }

      // Only show active quizzes
      const activeQuizzes = Array.isArray(data)
        ? data.filter(
            (quiz) =>
              quiz.is_active === 1 ||
              quiz.is_active === true
          )
        : [];

      setQuizzes(activeQuizzes);
    } catch (error) {
      console.error("QUIZ FETCH ERROR:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>Available Quizzes</h1>

          <p style={subHeadingStyle}>
            Test your skills and prepare for placement
          </p>
        </div>

        {/* Header Buttons */}
        <div style={headerButtonsStyle}>
          <button
            style={resultsButtonStyle}
            onClick={() =>
              navigate("/student/quiz-results")
            }
          >
            📊 Quiz Results
          </button>

          <button
            style={backButtonStyle}
            onClick={() =>
              navigate("/student/dashboard")
            }
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={messageStyle}>
          Loading quizzes...
        </div>
      )}

      {/* No quizzes */}
      {!loading && quizzes.length === 0 && (
        <div style={messageStyle}>
          <h3>No quizzes available</h3>

          <p>
            There are currently no active quizzes available.
          </p>
        </div>
      )}

      {/* Quiz Cards */}
      {!loading && quizzes.length > 0 && (
        <div style={quizGridStyle}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} style={quizCardStyle}>
              <div style={iconStyle}>📝</div>

              <h2 style={quizTitleStyle}>
                {quiz.title}
              </h2>

              <span style={categoryStyle}>
                {quiz.category}
              </span>

              <p style={descriptionStyle}>
                {quiz.description ||
                  "Test your knowledge and improve your placement preparation."}
              </p>

              <div style={infoRowStyle}>
                <div>
                  <strong>
                    {quiz.total_questions}
                  </strong>
                  <span> Questions</span>
                </div>

                <div>
                  <strong>
                    {quiz.duration_minutes}
                  </strong>
                  <span> Minutes</span>
                </div>
              </div>

              <button
                style={startButtonStyle}
                onClick={() => {
                  navigate(
                    `/student/quizzes/${quiz.id}`
                  );
                }}
              >
                Start Quiz →
              </button>
            </div>
          ))}
        </div>
      )}
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
  marginBottom: "30px",
};

const headerButtonsStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
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

const backButtonStyle = {
  border: "none",
  background: "#111827",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
};

const resultsButtonStyle = {
  border: "none",
  background: "#16a34a",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const quizGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "22px",
};

const quizCardStyle = {
  background: "#fff",
  borderRadius: "14px",
  padding: "25px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
};

const iconStyle = {
  fontSize: "38px",
  marginBottom: "12px",
};

const quizTitleStyle = {
  margin: "0 0 10px",
  color: "#111827",
  fontSize: "21px",
};

const categoryStyle = {
  display: "inline-block",
  background: "#eff6ff",
  color: "#2563eb",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const descriptionStyle = {
  color: "#6b7280",
  lineHeight: "1.6",
  minHeight: "55px",
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  borderTop: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
  padding: "15px 0",
  margin: "18px 0",
  color: "#4b5563",
};

const startButtonStyle = {
  width: "100%",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
};

const messageStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "40px",
  textAlign: "center",
  color: "#6b7280",
};

export default StudentQuizzes;