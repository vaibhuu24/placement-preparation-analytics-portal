import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentCompanies.css";

function StudentCompanies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  // Interactive states
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [appliedCompanies, setAppliedCompanies] = useState([]);
  const [applyingCompanyId, setApplyingCompanyId] = useState(null);
  const [confirmCompany, setConfirmCompany] = useState(null);

  // ================= LOAD STUDENT + COMPANIES + APPLICATIONS =================

  useEffect(() => {
    const storedStudent =
      localStorage.getItem("student") ||
      sessionStorage.getItem("student");

    if (!storedStudent) {
      navigate("/login");
      return;
    }

    let loggedInStudent;

    try {
      loggedInStudent = JSON.parse(storedStudent);
      setStudent(loggedInStudent);
    } catch (error) {
      console.error("Invalid student data:", error);

      localStorage.removeItem("student");
      sessionStorage.removeItem("student");

      navigate("/login");
      return;
    }

    // Load companies
    fetch("http://127.0.0.1:5000/api/companies", {
      headers: {
        Authorization: `Bearer ${
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token")
        }`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch companies");
        }

        return response.json();
      })
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      });

    // Load student's existing applications
    fetch(
      `http://127.0.0.1:5000/api/applications/student/${loggedInStudent.id}`,
      {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token")
          }`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const companyIds = data
            .map((application) => application.company_id)
            .filter((id) => id !== undefined && id !== null);

          setAppliedCompanies(companyIds);
        }
      })
      .catch((error) => {
        console.error("Error fetching student applications:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  // ================= LOGOUT =================

  const handleLogout = () => {
    localStorage.removeItem("student");
    sessionStorage.removeItem("student");

    navigate("/login");
  };

  // ================= LOCATIONS =================

  const locations = [
    "All",
    ...new Set(
      companies
        .map((company) => company.location)
        .filter((location) => location)
    ),
  ];

  // ================= SEARCH + FILTER =================

  const filteredCompanies = companies.filter((company) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (company.name || "")
        .toLowerCase()
        .includes(searchText) ||
      (company.industry || "")
        .toLowerCase()
        .includes(searchText) ||
      (company.required_skills || "")
        .toLowerCase()
        .includes(searchText);

    const matchesLocation =
      locationFilter === "All" ||
      company.location === locationFilter;

    return matchesSearch && matchesLocation;
  });

  // ================= APPLY =================

  const confirmApply = (company) => {
    setConfirmCompany(company);
  };

  const handleApply = async (company) => {
    if (appliedCompanies.includes(company.id)) {
      alert("You have already applied to this company.");
      return;
    }

    try {
      const storedStudent =
        localStorage.getItem("student") ||
        sessionStorage.getItem("student");

      if (!storedStudent) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      const loggedInStudent = JSON.parse(storedStudent);

      if (!loggedInStudent.id) {
        alert("Student ID not found. Please login again.");
        return;
      }

      setApplyingCompanyId(company.id);

      const response = await fetch(
        "http://127.0.0.1:5000/api/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("access_token") ||
              sessionStorage.getItem("access_token")
            }`,
          },
          body: JSON.stringify({
            student_id: loggedInStudent.id,
            company_id: company.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Application failed.");
        return;
      }

      // Add company to applied list
      setAppliedCompanies((previous) => {
        if (previous.includes(company.id)) {
          return previous;
        }

        return [...previous, company.id];
      });

      alert(
        data.message ||
          `Application submitted for ${company.name}.`
      );

      setSelectedCompany(null);
      setConfirmCompany(null);
    } catch (error) {
      console.error("Apply error:", error);
      alert("Cannot connect to backend.");
    } finally {
      setApplyingCompanyId(null);
    }
  };

  // ================= LOADING =================

  if (!student) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="student-companies-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="student-companies-sidebar">

        <div className="sidebar-logo">
          <h2>Placement Portal</h2>
          <p>Student Panel</p>
        </div>

        <nav>

          <button
            onClick={() => navigate("/student/dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => navigate("/student/profile")}
          >
            👤 My Profile
          </button>

          <button className="active">
            🏢 Companies
          </button>

          <button
            onClick={() => navigate("/student/applications")}
          >
            📝 Applications
          </button>

          <button
            onClick={() => navigate("/student/quizzes")}
          >
            🧠 Quizzes
          </button>

          <button
            onClick={() => navigate("/student/quiz-results")}
          >
            📈 My Performance
          </button>

        </nav>

        <button
          className="companies-logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="student-companies-main">

        {/* HEADER */}

        <header className="companies-header">

          <div>
            <h1>Available Companies</h1>

            <p>
              Explore placement opportunities available for you.
            </p>
          </div>

          <div className="student-mini-profile">

            <div className="student-avatar">
              {(
                student.studentName ||
                student.name ||
                "S"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {student.studentName ||
                  student.name ||
                  "Student"}
              </strong>

              <span>
                {student.department || "Department"}
              </span>
            </div>

          </div>

        </header>

        {/* ================= SUMMARY ================= */}

        <div className="company-summary">

          <div>
            <span>Total Companies</span>

            <strong>
              {companies.length}
            </strong>
          </div>

          <div>
            <span>Your Department</span>

            <strong>
              {student.department || "N/A"}
            </strong>
          </div>

          <div>
            <span>Current Year</span>

            <strong>
              {student.currentYear || "N/A"}
            </strong>
          </div>

          <div>
            <span>Applied</span>

            <strong>
              {appliedCompanies.length}
            </strong>
          </div>

        </div>

        {/* ================= SEARCH & FILTER ================= */}

        <div className="company-search-section">

          <div className="company-search-box">
            🔎

            <input
              type="text"
              placeholder="Search company, role or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) =>
              setLocationFilter(e.target.value)
            }
            className="company-location-filter"
          >
            {locations.map((location) => (
              <option
                key={location}
                value={location}
              >
                {location === "All"
                  ? "All Locations"
                  : location}
              </option>
            ))}
          </select>

        </div>

        {/* RESULT COUNT */}

        {!loading && (
          <div className="company-result-count">
            Showing{" "}
            <strong>
              {filteredCompanies.length}
            </strong>{" "}
            of{" "}
            <strong>
              {companies.length}
            </strong>{" "}
            companies
          </div>
        )}

        {/* ================= COMPANY SECTION ================= */}

        <section className="companies-section">

          {loading ? (

            <div className="companies-loading">
              Loading companies...
            </div>

          ) : filteredCompanies.length === 0 ? (

            <div className="no-companies">

              <div className="no-company-icon">
                🔍
              </div>

              <h2>
                No Companies Found
              </h2>

              <p>
                Try changing your search or location filter.
              </p>

            </div>

          ) : (

            <div className="companies-grid">

              {filteredCompanies.map((company) => {

                const isApplied =
                  appliedCompanies.includes(company.id);

                const isApplying =
                  applyingCompanyId === company.id;

                return (

                  <div
                    className="student-company-card"
                    key={company.id}
                  >

                    {/* COMPANY HEADER */}

                    <div className="company-card-top">

                      <div className="company-icon">
                        {company.name
                          ?.charAt(0)
                          ?.toUpperCase() || "C"}
                      </div>

                      <div>

                        <h2>
                          {company.name ||
                            "Company"}
                        </h2>

                        <p>
                          {company.industry ||
                            "Job Opportunity"}
                        </p>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="company-details">

                      <div>
                        <span>💰 Package</span>

                        <strong>
                          {company.package
                            ? `${company.package} LPA`
                            : "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>📍 Location</span>

                        <strong>
                          {company.location ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>👥 Openings</span>

                        <strong>
                          {company.openings ?? 0}
                        </strong>
                      </div>

                      <div>
                        <span>🎓 Minimum CGPA</span>

                        <strong>
                          {company.minimum_cgpa ??
                            "Not specified"}
                        </strong>
                      </div>

                    </div>

                    {/* SKILLS */}

                    <div className="company-skills">

                      <span>
                        Required Skills
                      </span>

                      <p>
                        {company.required_skills ||
                          "Not specified"}
                      </p>

                    </div>

                    {/* ACTIONS */}

                    <div className="company-card-actions">

                      <button
                        className="view-company-btn"
                        onClick={() =>
                          setSelectedCompany(company)
                        }
                      >
                        👁️ View Details
                      </button>

                      <button
                        className={`apply-company-btn ${
                          isApplied ? "applied" : ""
                        }`}
                        disabled={
                          isApplied || isApplying
                        }
                        onClick={() =>
                          confirmApply(company)
                        }
                      >
                        {isApplying
                          ? "⏳ Applying..."
                          : isApplied
                          ? "✅ Applied"
                          : "📝 Apply Now"}
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* ================= APPLY CONFIRMATION POPUP ================= */}

        {confirmCompany && (
          <div
            className="company-modal-overlay"
            onClick={() => setConfirmCompany(null)}
          >
            <div
              className="company-modal"
              style={{
                maxWidth: "420px",
                textAlign: "center",
                padding: "28px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                📝
              </div>

              <h2 style={{ marginBottom: "10px" }}>
                Confirm Application
              </h2>

              <p style={{ marginBottom: "22px" }}>
                Are you sure you want to apply for{" "}
                <strong>{confirmCompany.name}</strong>?
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmCompany(null)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleApply(confirmCompany)}
                  disabled={applyingCompanyId === confirmCompany.id}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {applyingCompanyId === confirmCompany.id
                    ? "Applying..."
                    : "Confirm Apply"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= DETAILS MODAL ================= */}

        {selectedCompany && (

          <div
            className="company-modal-overlay"
            onClick={() =>
              setSelectedCompany(null)
            }
          >

            <div
              className="company-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedCompany(null)
                }
              >
                ✕
              </button>

              <div className="modal-company-header">

                <div className="modal-company-icon">
                  {selectedCompany.name
                    ?.charAt(0)
                    ?.toUpperCase() || "C"}
                </div>

                <div>

                  <h2>
                    {selectedCompany.name}
                  </h2>

                  <p>
                    {selectedCompany.industry ||
                      "Job Opportunity"}
                  </p>

                </div>

              </div>

              <div className="modal-details">

                <div>
                  <span>💰 Package</span>

                  <strong>
                    {selectedCompany.package
                      ? `${selectedCompany.package} LPA`
                      : "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>📍 Location</span>

                  <strong>
                    {selectedCompany.location ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>👥 Openings</span>

                  <strong>
                    {selectedCompany.openings ?? 0}
                  </strong>
                </div>

                <div>
                  <span>🎓 Minimum CGPA</span>

                  <strong>
                    {selectedCompany.minimum_cgpa ??
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>📅 Deadline</span>

                  <strong>
                    {selectedCompany.application_deadline ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>🛠️ Skills</span>

                  <strong>
                    {selectedCompany.required_skills ||
                      "Not specified"}
                  </strong>
                </div>

              </div>

              <div className="modal-description">

                <h3>Selection Process</h3>

                <p>
                  {selectedCompany.selection_process ||
                    "Not specified"}
                </p>

                <h3>Description</h3>

                <p>
                  {selectedCompany.company_description ||
                    "No description available."}
                </p>

              </div>

              <button
                className={`modal-apply-btn ${
                  appliedCompanies.includes(
                    selectedCompany.id
                  )
                    ? "applied"
                    : ""
                }`}
                disabled={
                  appliedCompanies.includes(
                    selectedCompany.id
                  ) ||
                  applyingCompanyId ===
                    selectedCompany.id
                }
                onClick={() =>
                  confirmApply(selectedCompany)
                }
              >
                {applyingCompanyId ===
                selectedCompany.id
                  ? "⏳ Applying..."
                  : appliedCompanies.includes(
                      selectedCompany.id
                    )
                  ? "✅ Already Applied"
                  : "📝 Apply Now"}
              </button>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default StudentCompanies;