import React, { useEffect, useState } from "react";
import {
  FaBell,
  FaPaperPlane,
  FaUsers,
  FaUser,
  FaCheckCircle,
} from "react-icons/fa";

const API_BASE = "http://127.0.0.1:5000";

const notificationTypes = [
  "General",
  "Application",
  "Company",
  "Quiz",
  "Placement",
  "Important",
];

export default function AdminNotifications() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    notification_type: "Quiz",
    send_to_all: true,
    student_id: "",
  });

  const [adminId, setAdminId] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const storedAdmin =
        localStorage.getItem("admin") ||
        sessionStorage.getItem("admin");

      if (storedAdmin) {
        const admin = JSON.parse(storedAdmin);
        setAdminId(admin?.id || "");
      }
    } catch (err) {
      console.error("Unable to read admin data:", err);
      setError("Unable to read admin information.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  const handleTargetChange = (sendToAll) => {
    setForm((prev) => ({
      ...prev,
      send_to_all: sendToAll,
      student_id: sendToAll ? "" : prev.student_id,
    }));

    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("SEND NOTIFICATION BUTTON CLICKED");

    setSuccess("");
    setError("");

    if (!adminId) {
      setError("Admin information not found. Please login again.");
      return;
    }

    if (!form.title.trim() || !form.message.trim()) {
      setError("Please enter notification title and message.");
      return;
    }

    if (!form.send_to_all && !form.student_id.trim()) {
      setError("Please enter a Student ID.");
      return;
    }

    const token =
      localStorage.getItem("admin_access_token") ||
      sessionStorage.getItem("admin_access_token");

    console.log("ADMIN TOKEN EXISTS:", !!token);

    if (!token) {
      setError("Admin session token not found. Please login again.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            admin_id: Number(adminId),
            student_id: form.send_to_all
              ? null
              : Number(form.student_id),
            send_to_all: form.send_to_all,
            title: form.title.trim(),
            message: form.message.trim(),
            notification_type: form.notification_type,
          }),
        }
      );

      console.log(
        "NOTIFICATION API STATUS:",
        response.status
      );

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (response.status === 401) {
        setError(
          data.error ||
            "Admin session is invalid or expired. Please login again."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to send notification."
        );
      }

      setSuccess(
        data.message || "Notification sent successfully."
      );

      setForm({
        title: "",
        message: "",
        notification_type: "Quiz",
        send_to_all: true,
        student_id: "",
      });

      // IMPORTANT:
      // Do not remove the admin token.
      // Do not navigate to the login page.
      // Stay on the Notifications page after successful sending.
    } catch (err) {
      console.error("Send notification error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            <FaBell style={{ marginRight: 10 }} />
            Notifications
          </h1>

          <p style={styles.subheading}>
            Send important updates to students.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.iconBox}>
            <FaPaperPlane />
          </div>

          <div>
            <h2 style={styles.cardTitle}>
              Create Notification
            </h2>

            <p style={styles.cardSubtitle}>
              Send a notification to all students or one student.
            </p>
          </div>
        </div>

        {success && (
          <div style={styles.success}>
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>
              Notification Title
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: New Placement Drive"
              style={styles.input}
              maxLength={200}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.groupHalf}>
              <label style={styles.label}>
                Notification Type
              </label>

              <select
                name="notification_type"
                value={form.notification_type}
                onChange={handleChange}
                style={styles.input}
              >
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.groupHalf}>
              <label style={styles.label}>
                Send To
              </label>

              <div style={styles.targetButtons}>
                <button
                  type="button"
                  onClick={() => handleTargetChange(true)}
                  style={{
                    ...styles.targetButton,
                    ...(form.send_to_all
                      ? styles.targetButtonActive
                      : {}),
                  }}
                >
                  <FaUsers />
                  All Students
                </button>

                <button
                  type="button"
                  onClick={() => handleTargetChange(false)}
                  style={{
                    ...styles.targetButton,
                    ...(!form.send_to_all
                      ? styles.targetButtonActive
                      : {}),
                  }}
                >
                  <FaUser />
                  One Student
                </button>
              </div>
            </div>
          </div>

          {!form.send_to_all && (
            <div style={styles.group}>
              <label style={styles.label}>
                Student ID
              </label>

              <input
                type="number"
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                placeholder="Enter student ID"
                style={styles.input}
                min="1"
              />
            </div>
          )}

          <div style={styles.group}>
            <label style={styles.label}>
              Message
            </label>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Write notification message..."
              style={styles.textarea}
              rows="6"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            style={{
              ...styles.submitButton,
              ...(sending ? styles.disabledButton : {}),
            }}
          >
            <FaPaperPlane />

            {sending
              ? "Sending..."
              : "Send Notification"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    minHeight: "100vh",
    background: "#f5f7fb",
  },

  header: {
    marginBottom: "24px",
  },

  heading: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
    color: "#1f2937",
    display: "flex",
    alignItems: "center",
  },

  subheading: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "15px",
  },

  card: {
    maxWidth: "900px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.07)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "26px",
  },

  iconBox: {
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
    fontSize: "21px",
    color: "#111827",
  },

  cardSubtitle: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  success: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    marginBottom: "18px",
    borderRadius: "8px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "14px",
  },

  error: {
    padding: "12px 14px",
    marginBottom: "18px",
    borderRadius: "8px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
  },

  group: {
    marginBottom: "20px",
  },

  row: {
    display: "flex",
    gap: "20px",
    marginBottom: "0",
  },

  groupHalf: {
    flex: 1,
    marginBottom: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },

  targetButtons: {
    display: "flex",
    gap: "10px",
  },

  targetButton: {
    flex: 1,
    minHeight: "44px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "13px",
  },

  targetButtonActive: {
    border: "1px solid #4f46e5",
    background: "#eef2ff",
    color: "#4338ca",
  },

  submitButton: {
    border: "none",
    borderRadius: "9px",
    background: "#4f46e5",
    color: "#fff",
    padding: "13px 22px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
};
