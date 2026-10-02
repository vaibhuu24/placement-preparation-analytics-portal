import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  FaUsers,
  FaBuilding,
  FaClipboardList,
  FaUserCheck,
} from "react-icons/fa";

const API_BASE = "http://127.0.0.1:5000";

function Analytics() {
  const [stats, setStats] = useState({
    total_students: 0,
    total_companies: 0,
    total_applications: 0,
    selected_students: 0,
  });

  const [departmentData, setDepartmentData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Get the admin JWT token.
        const token =
          localStorage.getItem("admin_access_token") ||
          sessionStorage.getItem("admin_access_token");

        console.log("ANALYTICS TOKEN EXISTS:", !!token);

        if (!token) {
          throw new Error(
            "Admin token not found. Please login again."
          );
        }

        // All three dashboard APIs require the admin JWT.
        const authHeaders = {
          Authorization: `Bearer ${token}`,
        };

        const [statsResponse, departmentResponse, monthlyResponse] =
          await Promise.all([
            fetch(`${API_BASE}/api/admin/dashboard/stats`, {
              headers: authHeaders,
            }),
            fetch(`${API_BASE}/api/admin/dashboard/department-stats`, {
              headers: authHeaders,
            }),
            fetch(`${API_BASE}/api/admin/dashboard/monthly-stats`, {
              headers: authHeaders,
            }),
          ]);

        console.log(
          "ANALYTICS API STATUS:",
          statsResponse.status,
          departmentResponse.status,
          monthlyResponse.status
        );

        const statsData = await statsResponse.json();
        const departmentDataResponse =
          await departmentResponse.json();
        const monthlyDataResponse =
          await monthlyResponse.json();

        if (!statsResponse.ok) {
          throw new Error(
            statsData.error || "Failed to load statistics."
          );
        }

        if (!departmentResponse.ok) {
          throw new Error(
            departmentDataResponse.error ||
              "Failed to load department statistics."
          );
        }

        if (!monthlyResponse.ok) {
          throw new Error(
            monthlyDataResponse.error ||
              "Failed to load monthly statistics."
          );
        }

        setStats(statsData);
        setDepartmentData(departmentDataResponse);
        setMonthlyData(monthlyDataResponse);
      } catch (error) {
        console.error("Analytics error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>
            Placement performance and application analytics
          </p>
        </div>
      </div>

      {/* STATISTICS */}
      <div style={styles.statsGrid}>
        <AnalyticsCard
          icon={<FaUsers />}
          title="Total Students"
          value={loading ? "..." : stats.total_students}
        />

        <AnalyticsCard
          icon={<FaBuilding />}
          title="Total Companies"
          value={loading ? "..." : stats.total_companies}
        />

        <AnalyticsCard
          icon={<FaClipboardList />}
          title="Total Applications"
          value={loading ? "..." : stats.total_applications}
        />

        <AnalyticsCard
          icon={<FaUserCheck />}
          title="Placed Students"
          value={loading ? "..." : stats.selected_students}
        />
      </div>

      {/* DEPARTMENT CHART */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h2>Department-wise Placement</h2>
          <p>Students and placed students by department</p>
        </div>

        <div style={styles.chartContainer}>
          {loading ? (
            <p>Loading department data...</p>
          ) : departmentData.length === 0 ? (
            <p>No department data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="students"
                  name="Total Students"
                  fill="#93c5fd"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="placed"
                  name="Placed Students"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* MONTHLY CHART */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h2>Monthly Placement Trend</h2>
          <p>Placement growth over time</p>
        </div>

        <div style={styles.chartContainer}>
          {loading ? (
            <p>Loading monthly data...</p>
          ) : monthlyData.length === 0 ? (
            <p>No monthly placement data available.</p>
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
    </div>
  );
}

function AnalyticsCard({ icon, title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.icon}>
        {icon}
      </div>

      <div>
        <p style={styles.cardTitle}>{title}</p>
        <h2 style={styles.cardValue}>{value}</h2>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background: "#f5f7fb",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#111827",
  },

  subtitle: {
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "25px",
  },

  statCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },

  icon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#eef2ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  cardTitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },

  cardValue: {
    margin: "5px 0 0",
    color: "#111827",
    fontSize: "25px",
  },

  chartCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },

  chartHeader: {
    marginBottom: "20px",
  },

  chartContainer: {
    width: "100%",
    height: "350px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Analytics;
