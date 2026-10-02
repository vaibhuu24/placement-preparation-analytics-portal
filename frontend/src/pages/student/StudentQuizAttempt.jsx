import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function StudentQuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

      const quizResponse = await fetch(
        "http://127.0.0.1:5000/api/admin/quizzes",
        {
          headers: authHeaders,
        }
      );

      if (quizResponse.status === 401) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      const quizData = await quizResponse.json();

      if (!quizResponse.ok) {
        throw new Error(
          quizData.error || "Failed to load quiz."
        );
      }

      const selectedQuiz = quizData.find(
        (item) => item.id === Number(quizId)
      );

      if (!selectedQuiz) {
        throw new Error("Quiz not found.");
      }

      setQuiz(selectedQuiz);

      const durationSeconds =
        Number(selectedQuiz.duration_minutes || 0) * 60;

      setTimeLeft(durationSeconds);
      setQuizStarted(true);

      const questionResponse = await fetch(
        `http://127.0.0.1:5000/api/admin/quizzes/${quizId}/questions`,
        {
          headers: authHeaders,
        }
      );

      if (questionResponse.status === 401) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      const questionData = await questionResponse.json();

      if (!questionResponse.ok) {
        throw new Error(
          questionData.error || "Failed to load questions."
        );
      }

      setQuestions(Array.isArray(questionData) ? questionData : []);
    } catch (error) {
      console.error("QUIZ ATTEMPT ERROR:", error);
      alert(error.message);
      navigate("/student/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const question = questions[currentQuestion];

    if (!question) {
      return;
    }

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [question.id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (submitting || result) {
      return;
    }

    const studentData =
      localStorage.getItem("student") ||
      sessionStorage.getItem("student");

    if (!studentData) {
      alert("Student login information not found.");
      return;
    }

    let student;

    try {
      student = JSON.parse(studentData);
    } catch (error) {
      console.error("STUDENT DATA ERROR:", error);
      alert("Invalid student login information.");
      return;
    }

    const unansweredCount =
      questions.length - Object.keys(answers).length;

    if (!autoSubmit) {
      const confirmSubmit = window.confirm(
        unansweredCount > 0
          ? `You have ${unansweredCount} unanswered question(s). Do you want to submit?`
          : "Are you sure you want to submit the quiz?"
      );

      if (!confirmSubmit) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const totalTime =
        Number(quiz?.duration_minutes || 0) * 60;

      const timeTaken = Math.max(
        0,
        totalTime - timeLeft
      );

      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!token) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        alert("Login session expired. Please login again.");
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/student/quizzes/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_id: student.id,
            answers,
            time_taken_seconds: timeTaken,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        alert("Login session expired. Please login again.");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to submit quiz."
        );
      }

      setResult(data);
    } catch (error) {
      console.error("SUBMIT QUIZ ERROR:", error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quiz timer.
  useEffect(() => {
    if (!quizStarted || !quiz || result || submitting) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmitQuiz(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quiz, result, submitting, timeLeft]);

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>
          <h2>Loading Quiz...</h2>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div style={pageStyle}>
        <div style={resultCardStyle}>
          <h1 style={resultTitleStyle}>Quiz Completed</h1>

          <p style={resultQuizTitleStyle}>
            {result.quiz_title}
          </p>

          <div style={resultScoreStyle}>
            {result.score} / {result.total_marks}
          </div>

          <p style={accuracyStyle}>
            Accuracy: {result.accuracy}%
          </p>

          <div style={resultGridStyle}>
            <div style={resultItemStyle}>
              <strong>{result.correct_answers}</strong>
              <span>Correct</span>
            </div>

            <div style={resultItemStyle}>
              <strong>{result.wrong_answers}</strong>
              <span>Wrong</span>
            </div>

            <div style={resultItemStyle}>
              <strong>{result.unanswered}</strong>
              <span>Unanswered</span>
            </div>
          </div>

          <button
            style={primaryButtonStyle}
            onClick={() => navigate("/student/quizzes")}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div style={pageStyle}>
        <div style={messageStyle}>
          <h2>No questions available</h2>
          <button
            style={primaryButtonStyle}
            onClick={() => navigate("/student/quizzes")}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const selectedAnswer = answers[question.id];

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>{quiz.title}</h1>

          <p style={subHeadingStyle}>
            {quiz.category} • {quiz.duration_minutes} minutes
          </p>
        </div>

        <div style={headerActionsStyle}>
          <div
            style={{
              ...timerStyle,
              ...(timeLeft <= 60 ? timerWarningStyle : {}),
            }}
          >
            <span>⏱ </span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            style={backButtonStyle}
            onClick={() => navigate("/student/quizzes")}
          >
            Exit Quiz
          </button>
        </div>
      </div>

      <div style={progressContainerStyle}>
        <div style={progressTextStyle}>
          Question {currentQuestion + 1} of {questions.length}
        </div>

        <div style={progressBackgroundStyle}>
          <div
            style={{
              ...progressBarStyle,
              width: `${
                ((currentQuestion + 1) / questions.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      <div style={questionCardStyle}>
        <div style={questionNumberStyle}>
          Question {currentQuestion + 1}
        </div>

        <h2 style={questionStyle}>
          {question.question_text}
        </h2>

        <div style={optionsContainerStyle}>
          <Option
            label="A"
            text={question.option_a}
            selected={selectedAnswer === "A"}
            onClick={() => handleAnswer("A")}
          />

          <Option
            label="B"
            text={question.option_b}
            selected={selectedAnswer === "B"}
            onClick={() => handleAnswer("B")}
          />

          <Option
            label="C"
            text={question.option_c}
            selected={selectedAnswer === "C"}
            onClick={() => handleAnswer("C")}
          />

          <Option
            label="D"
            text={question.option_d}
            selected={selectedAnswer === "D"}
            onClick={() => handleAnswer("D")}
          />
        </div>

        <div style={navigationStyle}>
          <button
            style={{
              ...secondaryButtonStyle,
              opacity: currentQuestion === 0 ? 0.5 : 1,
            }}
            disabled={currentQuestion === 0}
            onClick={handlePrevious}
          >
            ← Previous
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              style={primaryButtonStyle}
              onClick={handleNext}
            >
              Next →
            </button>
          ) : (
            <button
              style={submitButtonStyle}
              onClick={() => handleSubmitQuiz(false)}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>

      <div style={navigatorCardStyle}>
        <h3>Questions</h3>

        <div style={numberGridStyle}>
          {questions.map((item, index) => {
            const answered =
              answers[item.id] !== undefined;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentQuestion(index)}
                style={{
                  ...numberButtonStyle,
                  background:
                    currentQuestion === index
                      ? "#2563eb"
                      : answered
                      ? "#dcfce7"
                      : "#f3f4f6",
                  color:
                    currentQuestion === index
                      ? "#fff"
                      : answered
                      ? "#166534"
                      : "#374151",
                }}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Option Component
========================= */

function Option({
  label,
  text,
  selected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...optionStyle,
        border: selected
          ? "2px solid #2563eb"
          : "1px solid #d1d5db",
        background: selected ? "#eff6ff" : "#fff",
      }}
    >
      <span
        style={{
          ...optionLabelStyle,
          background: selected ? "#2563eb" : "#e5e7eb",
          color: selected ? "#fff" : "#374151",
        }}
      >
        {label}
      </span>

      <span>{text}</span>
    </button>
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
  gap: "12px",
};

const timerStyle = {
  minWidth: "105px",
  padding: "11px 16px",
  borderRadius: "8px",
  background: "#111827",
  color: "#fff",
  fontWeight: "700",
  fontSize: "18px",
  textAlign: "center",
};

const timerWarningStyle = {
  background: "#dc2626",
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

const progressContainerStyle = {
  background: "#fff",
  padding: "18px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const progressTextStyle = {
  fontWeight: "600",
  marginBottom: "10px",
  color: "#374151",
};

const progressBackgroundStyle = {
  width: "100%",
  height: "8px",
  background: "#e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
};

const progressBarStyle = {
  height: "100%",
  background: "#2563eb",
  borderRadius: "10px",
  transition: "width 0.3s ease",
};

const questionCardStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
};

const questionNumberStyle = {
  color: "#2563eb",
  fontWeight: "600",
  marginBottom: "12px",
};

const questionStyle = {
  color: "#111827",
  lineHeight: "1.5",
  marginBottom: "25px",
};

const optionsContainerStyle = {
  display: "grid",
  gap: "14px",
};

const optionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  width: "100%",
  padding: "15px",
  borderRadius: "9px",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "15px",
};

const optionLabelStyle = {
  minWidth: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  fontWeight: "600",
};

const navigationStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "30px",
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
  padding: "12px 22px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const submitButtonStyle = {
  border: "none",
  background: "#16a34a",
  color: "#fff",
  padding: "12px 22px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const navigatorCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  marginTop: "20px",
};

const numberGridStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const numberButtonStyle = {
  width: "40px",
  height: "40px",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

const loadingStyle = {
  background: "#fff",
  padding: "40px",
  textAlign: "center",
  borderRadius: "12px",
};

const messageStyle = {
  background: "#fff",
  padding: "40px",
  textAlign: "center",
  borderRadius: "12px",
};

const resultCardStyle = {
  maxWidth: "700px",
  margin: "50px auto",
  background: "#fff",
  padding: "40px",
  borderRadius: "14px",
  textAlign: "center",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
};

const resultTitleStyle = {
  margin: "0 0 10px",
  color: "#111827",
};

const resultQuizTitleStyle = {
  color: "#6b7280",
  marginBottom: "25px",
};

const resultScoreStyle = {
  fontSize: "42px",
  fontWeight: "700",
  color: "#2563eb",
  marginBottom: "8px",
};

const accuracyStyle = {
  color: "#4b5563",
  fontSize: "17px",
  marginBottom: "30px",
};

const resultGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "15px",
  marginBottom: "30px",
};

const resultItemStyle = {
  background: "#f5f7fb",
  padding: "18px",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

export default StudentQuizAttempt;
