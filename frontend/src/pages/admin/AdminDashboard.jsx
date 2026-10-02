import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaGraduationCap,
  FaTachometerAlt,
  FaUsers,
  FaBuilding,
  FaClipboardList,
  FaQuestionCircle,
  FaBell,
  FaChartBar,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaUserGraduate,
  FaUserCheck,
  FaArrowUp,
  FaEllipsisV,
  FaShieldAlt,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

function AdminDashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const [dashboardStats, setDashboardStats] = useState({
    total_students: 0,
    total_companies: 0,
    total_applications: 0,
    selected_students: 0,
    shortlisted_applications: 0,
    applied_applications: 0,
    rejected_applications: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  // ==========================================
  // RECENT APPLICATIONS
  // ==========================================

  const [recentApplications, setRecentApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  // ==========================================
  // FETCH DASHBOARD STATISTICS
  // ==========================================

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);

        const response = await fetch(
          "http://127.0.0.1:5000/api/admin/dashboard/stats",
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("admin_access_token") ||
                sessionStorage.getItem("admin_access_token")
              }`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load dashboard statistics."
          );
        }

        setDashboardStats(data);
      } catch (error) {
        console.error("Dashboard statistics error:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // ==========================================
  // FETCH RECENT APPLICATIONS
  // ==========================================

  useEffect(() => {
    const fetchRecentApplications = async () => {
      try {
        setApplicationsLoading(true);

        const response = await fetch(
          "http://127.0.0.1:5000/api/applications",
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("admin_access_token") ||
                sessionStorage.getItem("admin_access_token")
              }`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load applications."
          );
        }

        // Get latest 5 applications
        const latestApplications = [...data]
          .sort(
            (a, b) =>
              new Date(b.applied_at) - new Date(a.applied_at)
          )
          .slice(0, 5);

        setRecentApplications(latestApplications);
      } catch (error) {
        console.error("Recent applications error:", error);
        setRecentApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchRecentApplications();
  }, []);

// ==========================================
// DEPARTMENT-WISE PLACEMENT DATA
// ==========================================

const [departmentData, setDepartmentData] = useState([]);
const [departmentLoading, setDepartmentLoading] = useState(true);

useEffect(() => {
  const fetchDepartmentStats = async () => {
    try {
      setDepartmentLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/admin/dashboard/department-stats",
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("admin_access_token") ||
              sessionStorage.getItem("admin_access_token")
            }`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load department statistics."
        );
      }

      setDepartmentData(data);
    } catch (error) {
      console.error("Department statistics error:", error);
      setDepartmentData([]);
    } finally {
      setDepartmentLoading(false);
    }
  };

  fetchDepartmentStats();
}, []);

  // ==========================================
// MONTHLY PLACEMENT TREND
// ==========================================

const [monthlyData, setMonthlyData] = useState([]);
const [monthlyLoading, setMonthlyLoading] = useState(true);

useEffect(() => {
  const fetchMonthlyStats = async () => {
    try {
      setMonthlyLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/admin/dashboard/monthly-stats",
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("admin_access_token") ||
              sessionStorage.getItem("admin_access_token")
            }`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load monthly placement statistics."
        );
      }

      setMonthlyData(data);
    } catch (error) {
      console.error("Monthly placement statistics error:", error);
      setMonthlyData([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  fetchMonthlyStats();
}, []);

  // ==========================================
  // MENU ITEMS
  // ==========================================

  const menuItems = [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      name: "Students",
      icon: <FaUsers />,
    },
    {
      name: "Companies",
      icon: <FaBuilding />,
    },
    {
      name: "Applications",
      icon: <FaClipboardList />,
    },
    {
      name: "Quizzes",
      icon: <FaQuestionCircle />,
    },
    {
      name: "Notifications",
      icon: <FaBell />,
    },
    {
      name: "Analytics",
      icon: <FaChartBar />,
    },
    {
      name: "Reports",
      icon: <FaFileAlt />,
    },
    {
      name: "Settings",
      icon: <FaCog />,
    },
  ];

  // ==========================================
  // MENU NAVIGATION
  // ==========================================

  const handleMenuClick = (name) => {
    setActiveMenu(name);
    setSidebarOpen(false);

    if (name === "Dashboard") {
      navigate("/admin/dashboard");
    }

    if (name === "Students") {
      navigate("/admin/students");
    }

    if (name === "Companies") {
      navigate("/admin/companies");
    }

    if (name === "Applications") {
      navigate("/admin/applications");
    }

    if (name === "Quizzes") {
      navigate("/admin/quizzes");
    }
    if (name === "Notifications") {
    navigate("/admin/notifications");
    }
    if (name === "Analytics") {
      navigate("/admin/analytics");
    }
    if (name === "Reports") {
      navigate("/admin/reports");
    }
    if (name === "Settings") {
      navigate("/admin/settings");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    // Remove admin profile and JWT from both storages.
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_access_token");

    sessionStorage.removeItem("admin");
    sessionStorage.removeItem("admin_access_token");

    // Use a full navigation so the dashboard state is cleared.
    window.location.replace("/admin/login");
  };

  return (
    <div className="admin-dashboard">

      {/* ==========================================
          MOBILE OVERLAY
      ========================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        {/* Logo */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            <FaGraduationCap />
          </div>

          <div>
            <h2>Placement Portal</h2>
            <p>Admin Panel</p>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>

        </div>

        {/* Navigation */}

        <nav className="sidebar-navigation">

          <p className="nav-title">
            MAIN MENU
          </p>

          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`sidebar-link ${
                activeMenu === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleMenuClick(item.name)
              }
            >

              <span className="sidebar-link-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

            </button>
          ))}

        </nav>

        {/* Bottom */}

        <div className="sidebar-bottom">

          <div className="sidebar-help">

            <FaShieldAlt />

            <div>
              <strong>
                Secure Platform
              </strong>

              <span>
                Protected admin access
              </span>
            </div>

          </div>

          <button
            className="logout-link"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            Logout
          </button>

        </div>

      </aside>

      {/* ==========================================
          MAIN AREA
      ========================================== */}

      <main className="admin-main">

        {/* ==========================================
            TOP NAVBAR
        ========================================== */}

        <header className="admin-navbar">

          <div className="navbar-left">

            <button
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <FaBars />
            </button>

            <div>
              <h1>Dashboard</h1>

              <p>
                Placement Management Overview
              </p>
            </div>

          </div>

          <div className="navbar-right">

            {/* Search */}

            <div className="admin-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search..."
              />

            </div>

            {/* Notification */}

            <button className="notification-button">

              <FaBell />

              <span className="notification-dot">
                3
              </span>

            </button>

            {/* Profile */}

            <div className="admin-profile">

              <div className="profile-avatar">
                A
              </div>

              <div className="profile-info">

                <strong>
                  Admin Officer
                </strong>

                <span>
                  Placement Officer
                </span>

              </div>

              <FaChevronDown
                className="profile-arrow"
              />

            </div>

          </div>

        </header>

        {/* ==========================================
            CONTENT
        ========================================== */}

        <div className="dashboard-content">

          {/* Welcome */}

          <section className="dashboard-welcome">

            <div>

              <span>
                ADMIN DASHBOARD
              </span>

              <h2>
                Good Morning, Admin
              </h2>

              <p>
                Here's what's happening with your
                placement activities today.
              </p>

            </div>

            <button
              className="dashboard-action"
              onClick={() =>
                navigate("/admin/companies")
              }
            >
              + Add Company
            </button>

          </section>

          {/* ==========================================
              STAT CARDS
          ========================================== */}

          <section className="stats-grid">

            <StatCard
              icon={<FaUserGraduate />}
              title="Total Students"
              value={
                statsLoading
                  ? "..."
                  : dashboardStats.total_students
              }
              change=""
              description="Registered students"
            />

            <StatCard
              icon={<FaBuilding />}
              title="Active Companies"
              value={
                statsLoading
                  ? "..."
                  : dashboardStats.total_companies
              }
              change=""
              description="Registered companies"
            />

            <StatCard
              icon={<FaClipboardList />}
              title="Applications"
              value={
                statsLoading
                  ? "..."
                  : dashboardStats.total_applications
              }
              change=""
              description="Total applications"
            />

            <StatCard
              icon={<FaUserCheck />}
              title="Placed Students"
              value={
                statsLoading
                  ? "..."
                  : dashboardStats.selected_students
              }
              change=""
              description="Selected applications"
            />

          </section>

          {/* ==========================================
              CHARTS
          ========================================== */}

          <section className="dashboard-charts">

            {/* Department Chart */}

            <div className="dashboard-card chart-card">

              <div className="card-header">

                <div>

                  <h3>
                    Department-wise Placement
                  </h3>

                  <p>
                    Placement performance by department
                  </p>

                </div>

                <button className="card-menu">
                  <FaEllipsisV />
                </button>

              </div>

              <div className="chart-container">

                {departmentLoading ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Loading department data...
                  </div>
                ) : departmentData.length === 0 ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No department data available.
                  </div>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart data={departmentData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="department"
                      />

                      <YAxis />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="placed"
                        name="Placed"
                        fill="#2563eb"
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="students"
                        name="Total Students"
                        fill="#93c5fd"
                        radius={[5, 5, 0, 0]}
                      />

                    </BarChart>
                  </ResponsiveContainer>
                )}

              </div>

            </div>

            {/* Monthly Chart */}

            <div className="dashboard-card chart-card">

              <div className="card-header">

                <div>

                  <h3>
                    Monthly Placement Trend
                  </h3>

                  <p>
                    Placement growth over time
                  </p>

                </div>

                <button className="card-menu">
                  <FaEllipsisV />
                </button>

              </div>

              <div className="chart-container">

                {monthlyLoading ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Loading monthly placement data...
                  </div>
                ) : monthlyData.length === 0 ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No placement data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="placements"
                        name="Placements"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

              </div>

            </div>

          </section>

          {/* ==========================================
              LOWER SECTION
          ========================================== */}

          <section className="dashboard-lower-grid">

            {/* Recent Applications */}

            <div className="dashboard-card applications-card">

              <div className="card-header">

                <div>

                  <h3>
                    Recent Applications
                  </h3>

                  <p>
                    Latest student applications
                  </p>

                </div>

                <button
                  className="view-all"
                  onClick={() =>
                    navigate("/admin/applications")
                  }
                >
                  View All
                </button>

              </div>

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>Student</th>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>

                  </thead>

                  <tbody>

                    {applicationsLoading ? (

                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            textAlign: "center",
                            padding: "30px",
                          }}
                        >
                          Loading applications...
                        </td>
                      </tr>

                    ) : recentApplications.length === 0 ? (

                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            textAlign: "center",
                            padding: "30px",
                          }}
                        >
                          No applications found.
                        </td>
                      </tr>

                    ) : (

                      recentApplications.map(
                        (application, index) => (

                          <tr
                            key={
                              application.id ||
                              index
                            }
                          >

                            {/* Student */}

                            <td>

                              <div className="student-cell">

                                <div className="student-avatar">

                                  {(
                                    application.student_name ||
                                    "S"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}

                                </div>

                                <div>

                                  <strong>
                                    {
                                      application.student_name ||
                                      "Unknown Student"
                                    }
                                  </strong>

                                  <span>
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
                                      : "-"}
                                  </span>

                                </div>

                              </div>

                            </td>

                            {/* Company */}

                            <td>
                              {
                                application.company_name ||
                                "-"
                              }
                            </td>

                            {/* Role */}

                            <td>
                              {
                                application.role ||
                                "-"
                              }
                            </td>

                            {/* Status */}

                            <td>

                              <StatusBadge
                                status={
                                  application.status ||
                                  "Applied"
                                }
                              />

                            </td>

                            {/* Date */}

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
                                : "-"}
                            </td>

                            {/* Menu */}

                            <td>

                              <button
                                className="table-menu"
                                onClick={() =>
                                  navigate("/admin/applications")
                                }
                                title="View application"
                              >
                                <FaEllipsisV />
                              </button>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* Quick Actions */}

            <div className="dashboard-card quick-actions-card">

              <div className="card-header">

                <div>

                  <h3>
                    Quick Actions
                  </h3>

                  <p>
                    Frequently used actions
                  </p>

                </div>

              </div>

              <div className="quick-actions">

                <QuickAction
                  icon={<FaUsers />}
                  title="Manage Students"
                  text="View and manage students"
                  onClick={() =>
                    navigate("/admin/students")
                  }
                />

                <QuickAction
                  icon={<FaBuilding />}
                  title="Add Company"
                  text="Create a new company"
                  onClick={() =>
                    navigate("/admin/companies")
                  }
                />

               <QuickAction
                  icon={<FaQuestionCircle />}
                  title="Create Quiz"
                  text="Add quiz questions"
                  onClick={() => navigate("/admin/quizzes")}
                />
                <QuickAction
                  icon={<FaBell />}
                  title="Send Notification"
                  text="Notify students"
                  onClick={() =>
                    navigate("/admin/notifications")
                  }
                />

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  title,
  value,
  change,
  description,
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <div className="stat-icon">
          {icon}
        </div>

        <button className="card-menu">
          <FaEllipsisV />
        </button>

      </div>

      <p className="stat-title">
        {title}
      </p>

      <h3 className="stat-value">
        {value}
      </h3>

      <div className="stat-change">

        {change && (
          <span>
            <FaArrowUp />
            {change}
          </span>
        )}

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}


/* ============================================================
   STATUS
============================================================ */

function StatusBadge({ status }) {
  const statusClass = String(status)
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span
      className={`status-badge ${statusClass}`}
    >
      {status}
    </span>
  );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      className="quick-action"
      onClick={onClick}
    >

      <div className="quick-action-icon">
        {icon}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>

      </div>

      <FaArrowUp className="quick-arrow" />

    </button>
  );
}


export default AdminDashboard;