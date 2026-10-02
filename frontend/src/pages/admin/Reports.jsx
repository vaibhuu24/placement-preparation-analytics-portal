import { useEffect, useState } from "react";
import {
  FaUsers,
  FaBuilding,
  FaClipboardList,
  FaUserCheck,
  FaDownload,
} from "react-icons/fa";

const API_BASE = "http://127.0.0.1:5000";

function Reports() {
  const [stats, setStats] = useState({
    total_students: 0,
    total_companies: 0,
    total_applications: 0,
    selected_students: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("admin_access_token") ||
        sessionStorage.getItem("admin_access_token");

      console.log("REPORTS TOKEN EXISTS:", !!token);

      if (!token) {
        throw new Error(
          "Admin token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/admin/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("REPORTS API STATUS:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load report data."
        );
      }

      setStats(data);
    } catch (error) {
      console.error("Reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const report = `
PLACEMENT PORTAL - PLACEMENT REPORT
====================================

Total Students: ${stats.total_students}
Total Companies: ${stats.total_companies}
Total Applications: ${stats.total_applications}
Placed Students: ${stats.selected_students}

Generated from Placement Preparation & Analytics Portal.
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "placement-report.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports</h1>

          <p style={styles.subtitle}>
            Placement and recruitment summary
          </p>
        </div>

        <button
          style={styles.downloadButton}
          onClick={downloadReport}
        >
          <FaDownload />
          Download Report
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={styles.grid}>
        <ReportCard
          icon={<FaUsers />}
          title="Total Students"
          value={loading ? "..." : stats.total_students}
        />

        <ReportCard
          icon={<FaBuilding />}
          title="Total Companies"
          value={loading ? "..." : stats.total_companies}
        />

        <ReportCard
          icon={<FaClipboardList />}
          title="Total Applications"
          value={loading ? "..." : stats.total_applications}
        />

        <ReportCard
          icon={<FaUserCheck />}
          title="Placed Students"
          value={loading ? "..." : stats.selected_students}
        />
      </div>

      {/* REPORT SUMMARY */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Placement Summary
        </h2>

        <div style={styles.summaryRow}>
          <span>Total Students</span>
          <strong>
            {loading ? "..." : stats.total_students}
          </strong>
        </div>

        <div style={styles.summaryRow}>
          <span>Total Companies</span>
          <strong>
            {loading ? "..." : stats.total_companies}
          </strong>
        </div>

        <div style={styles.summaryRow}>
          <span>Total Applications</span>
          <strong>
            {loading ? "..." : stats.total_applications}
          </strong>
        </div>

        <div style={styles.summaryRow}>
          <span>Placed Students</span>
          <strong>
            {loading ? "..." : stats.selected_students}
          </strong>
        </div>
      </div>

      {/* INFORMATION */}
      <div style={styles.infoCard}>
        <h3>Report Information</h3>

        <p>
          This report provides an overview of student placement
          activities, registered companies, applications, and
          selected students.
        </p>

        <p>
          Click <strong>Download Report</strong> to save the
          current placement summary.
        </p>
      </div>
    </div>
  );
}

function ReportCard({ icon, title, value }) {
  return (
    <div style={styles.reportCard}>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "15px",
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

  downloadButton: {
    border: "none",
    borderRadius: "9px",
    background: "#4f46e5",
    color: "#ffffff",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "25px",
  },

  reportCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
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

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#111827",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
  },

  infoCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
    color: "#6b7280",
    lineHeight: 1.6,
  },
};

export default Reports;
