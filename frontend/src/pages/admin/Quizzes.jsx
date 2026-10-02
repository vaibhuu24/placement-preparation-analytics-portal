import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Quizzes() {
  const navigate = useNavigate();

  // -----------------------------
  // Quiz states
  // -----------------------------
  const [quizzes, setQuizzes] = useState([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);

  // -----------------------------
  // Question states
  // -----------------------------
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [marks, setMarks] = useState(1);
  const [topic, setTopic] = useState("");

  const [quizQuestions, setQuizQuestions] = useState([]);

  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Admin JWT helper
  // -----------------------------
  const getAdminToken = () => {
    return (
      localStorage.getItem("admin_access_token") ||
      sessionStorage.getItem("admin_access_token")
    );
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_access_token");
    sessionStorage.removeItem("admin");
    sessionStorage.removeItem("admin_access_token");

    navigate("/admin/login", { replace: true });
  };

  // Database-supported categories
  const categories = [
    "Aptitude",
    "Logical Reasoning",
    "SQL",
    "Python",
    "Java",
    "C++",
    "Excel",
    "Power BI",
    "Statistics",
    "Data Analytics",
  ];

  // -----------------------------
  // Load quizzes
  // -----------------------------
  const fetchQuizzes = async () => {
    try {
      setLoading(true);

      const token = getAdminToken();

      if (!token) {
        handleUnauthorized();
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

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load quizzes.");
      }

      setQuizzes(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // -----------------------------
  // Create quiz
  // -----------------------------
  const handleCreateQuiz = async (e) => {
    e.preventDefault();

    if (!title.trim() || !category || !description.trim()) {
      alert("Please fill all quiz fields.");
      return;
    }

    try {
      const token = getAdminToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/admin/quizzes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            category,
            description: description.trim(),
            duration_minutes: Number(duration),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create quiz.");
      }

      alert("Quiz created successfully!");

      setTitle("");
      setCategory("");
      setDescription("");
      setDuration(30);

      fetchQuizzes();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // -----------------------------
  // Select quiz
  // -----------------------------
  const handleSelectQuiz = async (quiz) => {
    setSelectedQuiz(quiz);

    try {
      const token = getAdminToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/admin/quizzes/${quiz.id}/questions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load questions.");
      }

      setQuizQuestions(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // -----------------------------
  // Add question
  // -----------------------------
  const handleAddQuestion = async (e) => {
    e.preventDefault();

    if (
      !question.trim() ||
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim() ||
      !correctAnswer
    ) {
      alert("Please fill all question fields.");
      return;
    }

    if (!selectedQuiz) {
      alert("Please select a quiz first.");
      return;
    }

    try {
      const token = getAdminToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/admin/quizzes/${selectedQuiz.id}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question_text: question.trim(),
            option_a: optionA.trim(),
            option_b: optionB.trim(),
            option_c: optionC.trim(),
            option_d: optionD.trim(),
            correct_answer: correctAnswer,
            marks: Number(marks),
            topic: topic.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to add question.");
      }

      alert("Question added successfully!");

      setQuestion("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      setMarks(1);
      setTopic("");

      // Reload questions
      handleSelectQuiz(selectedQuiz);

      // Reload quiz count
      fetchQuizzes();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // -----------------------------
  // Activate / Deactivate quiz
  // -----------------------------
  const handleQuizStatus = async (quiz) => {
    const action = quiz.is_active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${quiz.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = getAdminToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/admin/quizzes/${quiz.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: !Boolean(quiz.is_active),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to ${action} quiz.`
        );
      }

      alert(data.message || `Quiz ${action}d successfully!`);

      fetchQuizzes();
    } catch (error) {
      console.error("QUIZ STATUS ERROR:", error);
      alert(error.message);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>Quiz Management</h1>
          <p style={subHeadingStyle}>
            Create quizzes and manage quiz questions
          </p>
        </div>

        <button
          style={backButtonStyle}
          onClick={() => navigate("/admin/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* ========================= */}
      {/* CREATE QUIZ */}
      {/* ========================= */}

      <div style={cardStyle}>
        <h2 style={sectionHeadingStyle}>Create New Quiz</h2>

        <form onSubmit={handleCreateQuiz}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Quiz Title</label>

              <input
                type="text"
                placeholder="Example: SQL Interview Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Category</label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select Category</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Duration (Minutes)</label>

              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <label style={labelStyle}>Description</label>

            <textarea
              placeholder="Enter quiz description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={textareaStyle}
            />
          </div>

          <button type="submit" style={primaryButtonStyle}>
            + Create Quiz
          </button>
        </form>
      </div>

      {/* ========================= */}
      {/* EXISTING QUIZZES */}
      {/* ========================= */}

      <div style={cardStyle}>
        <h2 style={sectionHeadingStyle}>Existing Quizzes</h2>

        {loading ? (
          <p>Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p style={emptyStyle}>No quizzes created yet.</p>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Duration</th>
                  <th style={thStyle}>Questions</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td style={tdStyle}>{quiz.id}</td>

                    <td style={tdStyle}>
                      <strong>{quiz.title}</strong>
                    </td>

                    <td style={tdStyle}>{quiz.category}</td>

                    <td style={tdStyle}>
                      {quiz.duration_minutes} min
                    </td>

                    <td style={tdStyle}>
                      {quiz.total_questions}
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={
                          quiz.is_active
                            ? activeStatusStyle
                            : inactiveStatusStyle
                        }
                      >
                        {quiz.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div style={actionContainerStyle}>
                        <button
                          style={secondaryButtonStyle}
                          onClick={() => handleSelectQuiz(quiz)}
                        >
                          Manage Questions
                        </button>

                        <button
                          style={
                            quiz.is_active
                              ? deactivateButtonStyle
                              : activateButtonStyle
                          }
                          onClick={() => handleQuizStatus(quiz)}
                        >
                          {quiz.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* ADD QUESTION */}
      {/* ========================= */}

      {selectedQuiz && (
        <div style={cardStyle}>
          <h2 style={sectionHeadingStyle}>
            Add Question
          </h2>

          <div style={selectedQuizBox}>
            <strong>{selectedQuiz.title}</strong>

            <span>
              {selectedQuiz.category} •{" "}
              {selectedQuiz.duration_minutes} minutes
            </span>
          </div>

          <form onSubmit={handleAddQuestion}>
            <div>
              <label style={labelStyle}>Question</label>

              <textarea
                placeholder="Enter question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={textareaStyle}
              />
            </div>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Option A</label>

                <input
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Enter option A"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Option B</label>

                <input
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Enter option B"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Option C</label>

                <input
                  type="text"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="Enter option C"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Option D</label>

                <input
                  type="text"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="Enter option D"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>
                  Correct Answer
                </label>

                <select
                  value={correctAnswer}
                  onChange={(e) =>
                    setCorrectAnswer(e.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Select Answer</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Marks</label>

                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Topic</label>

                <input
                  type="text"
                  placeholder="Example: Joins"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button type="submit" style={primaryButtonStyle}>
              + Add Question
            </button>
          </form>

          {/* Existing questions */}
          <div style={{ marginTop: "35px" }}>
            <h3 style={questionsHeadingStyle}>
              Questions ({quizQuestions.length})
            </h3>

            {quizQuestions.length === 0 ? (
              <p style={emptyStyle}>
                No questions added to this quiz yet.
              </p>
            ) : (
              <div>
                {quizQuestions.map((item, index) => (
                  <div
                    key={item.id}
                    style={questionCardStyle}
                  >
                    <div style={questionTitleStyle}>
                      Q{quizQuestions.length - index}.{" "}
                      {item.question_text}
                    </div>

                    <div style={optionsStyle}>
                      <div>
                        A. {item.option_a}
                      </div>

                      <div>
                        B. {item.option_b}
                      </div>

                      <div>
                        C. {item.option_c}
                      </div>

                      <div>
                        D. {item.option_d}
                      </div>
                    </div>

                    <div style={questionMetaStyle}>
                      <span>
                        Correct:{" "}
                        <strong>
                          {item.correct_answer}
                        </strong>
                      </span>

                      <span>
                        Marks: {item.marks}
                      </span>

                      {item.topic && (
                        <span>
                          Topic: {item.topic}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   STYLES
========================================== */

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
  color: "white",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
};

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "25px",
  marginBottom: "25px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const sectionHeadingStyle = {
  marginTop: 0,
  marginBottom: "20px",
  color: "#111827",
};

const questionsHeadingStyle = {
  color: "#111827",
  marginBottom: "15px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontWeight: "600",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  minHeight: "90px",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
  resize: "vertical",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  marginTop: "20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 20px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

const secondaryButtonStyle = {
  background: "#eef2ff",
  color: "#3730a3",
  border: "none",
  padding: "9px 13px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

const tableContainerStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "13px",
  background: "#f3f4f6",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
};

const tdStyle = {
  padding: "13px",
  borderBottom: "1px solid #e5e7eb",
  color: "#4b5563",
};

const emptyStyle = {
  color: "#6b7280",
  padding: "15px 0",
};

const selectedQuizBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#eff6ff",
  padding: "14px 16px",
  borderRadius: "8px",
  marginBottom: "22px",
  color: "#1e40af",
};

const questionCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "9px",
  padding: "17px",
  marginBottom: "12px",
};

const questionTitleStyle = {
  fontWeight: "600",
  color: "#111827",
  marginBottom: "12px",
};

const optionsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "8px",
  color: "#4b5563",
  fontSize: "14px",
};

const questionMetaStyle = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
  marginTop: "14px",
  fontSize: "13px",
  color: "#6b7280",
};

const actionContainerStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const activeStatusStyle = {
  display: "inline-block",
  background: "#dcfce7",
  color: "#166534",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const inactiveStatusStyle = {
  display: "inline-block",
  background: "#fee2e2",
  color: "#991b1b",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const deactivateButtonStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "none",
  padding: "9px 13px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

const activateButtonStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "none",
  padding: "9px 13px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "600",
};

export default Quizzes;