import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Applications.css";

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const getAdminToken = () => {
    return (
      localStorage.getItem("admin_access_token") ||
      sessionStorage.getItem("admin_access_token")
    );
  };

  // ==========================================
  // FETCH APPLICATIONS
  // ==========================================

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const token = getAdminToken();

      console.log("APPLICATIONS TOKEN EXISTS:", !!token);

      if (!token) {
        throw new Error(
          "Admin token not found. Please login again."
        );
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("APPLICATIONS API STATUS:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch applications."
        );
      }

      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Applications error:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // ==========================================
  // UPDATE APPLICATION STATUS
  // ==========================================

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);

      const response = await fetch(
        `http://127.0.0.1:5000/api/applications/${applicationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update application status."
        );
      }

      // Update only the changed application in the UI
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: newStatus,
              }
            : application
        )
      );

      console.log(data.message || "Application status updated.");
    } catch (error) {
      console.error("Status update error:", error);

      alert(
        error.message ||
          "Failed to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  const filteredApplications = applications.filter(
    (application) => {
      const searchText = search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        (application.student_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (application.company_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (application.role || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const totalApplications = applications.length;

  const appliedApplications = applications.filter(
    (app) => app.status === "Applied"
  ).length;

  const shortlistedApplications = applications.filter(
    (app) => app.status === "Shortlisted"
  ).length;

  const selectedApplications = applications.filter(
    (app) => app.status === "Selected"
  ).length;

  return (
    <div className="admin-applications-page">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside className="admin-applications-sidebar">

        <div className="admin-logo">
          <h2>Placement Portal</h2>
          <p>Admin Panel</p>
        </div>

        <nav>

          <button
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            📊 Dashboard
          </button>

          <button
            onClick={() =>
              navigate("/admin/students")
            }
          >
            👨‍🎓 Students
          </button>

          <button
            onClick={() =>
              navigate("/admin/companies")
            }
          >
            🏢 Companies
          </button>

          <button className="active">
            📝 Applications
          </button>

        </nav>

      </aside>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="admin-applications-main">

        {/* HEADER */}

        <header className="admin-applications-header">

          <div>

            <h1>Applications</h1>

            <p>
              View and manage student placement
              applications.
            </p>

          </div>

        </header>

        {/* ==========================================
            SUMMARY
        ========================================== */}

        <div className="admin-application-summary">

          <div>
            <span>Total Applications</span>
            <strong>{totalApplications}</strong>
          </div>

          <div>
            <span>Applied</span>
            <strong>{appliedApplications}</strong>
          </div>

          <div>
            <span>Shortlisted</span>
            <strong>{shortlistedApplications}</strong>
          </div>

          <div>
            <span>Selected</span>
            <strong>{selectedApplications}</strong>
          </div>

        </div>

        {/* ==========================================
            SEARCH
        ========================================== */}

        <div className="admin-application-search">

          🔎

          <input
            type="text"
            placeholder="Search student, company or role..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* ==========================================
            TABLE
        ========================================== */}

        <section className="admin-applications-section">

          {loading ? (

            <div className="admin-applications-loading">
              Loading applications...
            </div>

          ) : filteredApplications.length === 0 ? (

            <div className="admin-no-applications">

              <h2>No Applications Found</h2>

              <p>
                {search
                  ? "There are no applications matching your search."
                  : "There are no applications available."}
              </p>

            </div>

          ) : (

            <div className="admin-applications-table-wrapper">

              <table className="admin-applications-table">

                <thead>

                  <tr>

                    <th>ID</th>

                    <th>Student</th>

                    <th>Company</th>

                    <th>Role</th>

                    <th>Package</th>

                    <th>Applied Date</th>

                    <th>Status</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredApplications.map(
                    (application) => (

                      <tr
                        key={application.id}
                      >

                        {/* ID */}

                        <td>
                          #{application.id}
                        </td>

                        {/* STUDENT */}

                        <td>

                          <strong>
                            {application.student_name ||
                              "Student"}
                          </strong>

                          <small>
                            {application.college_email ||
                              ""}
                          </small>

                        </td>

                        {/* COMPANY */}

                        <td>
                          {application.company_name ||
                            "Company"}
                        </td>

                        {/* ROLE */}

                        <td>
                          {application.role ||
                            "Job Opportunity"}
                        </td>

                        {/* PACKAGE */}

                        <td>
                          {application.package_lpa
                            ? `${application.package_lpa} LPA`
                            : "N/A"}
                        </td>

                        {/* APPLIED DATE */}

                        <td>

                          {application.applied_at
                            ? new Date(
                                application.applied_at
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}

                        </td>

                        {/* STATUS */}

                        <td>

                          <select
                            value={
                              application.status ||
                              "Applied"
                            }
                            disabled={
                              updatingId ===
                              application.id
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                application.id,
                                e.target.value
                              )
                            }
                            className={`admin-application-status ${
                              (
                                application.status ||
                                "Applied"
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )
                            }`}
                            style={{
                              cursor:
                                updatingId ===
                                application.id
                                  ? "wait"
                                  : "pointer",
                              border: "none",
                              outline: "none",
                              fontWeight: 600,
                            }}
                          >

                            <option value="Applied">
                              Applied
                            </option>

                            <option value="Shortlisted">
                              Shortlisted
                            </option>

                            <option value="Selected">
                              Selected
                            </option>

                            <option value="Rejected">
                              Rejected
                            </option>

                          </select>

                        </td>

                      </tr>

                    )
                  )}

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
