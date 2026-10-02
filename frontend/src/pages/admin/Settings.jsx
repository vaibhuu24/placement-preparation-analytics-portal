import { useEffect, useState } from "react";
import {
  FaUser,
  FaLock,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  const getAdminToken = () =>
    localStorage.getItem("admin_access_token") ||
    sessionStorage.getItem("admin_access_token");

  const clearAdminSession = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_access_token");
    sessionStorage.removeItem("admin");
    sessionStorage.removeItem("admin_access_token");
  };

  // =========================
  // ADMIN PROFILE
  // =========================
  const [admin, setAdmin] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
  });

  // =========================
  // NOTIFICATION SETTINGS
  // =========================
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // =========================
  // PASSWORD
  // =========================
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD ADMIN DATA
  // =========================
  useEffect(() => {
    const storedAdmin =
      localStorage.getItem("admin") ||
      sessionStorage.getItem("admin");
    const token = getAdminToken();

    if (!storedAdmin || !token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);

        setAdmin({
          id: adminData.id || "",
          name: adminData.name || "",
          email: adminData.email || "",
          phone: adminData.phone || "",
        });
      } catch (error) {
        console.error("Error reading admin data:", error);
      }
    }
  }, []);

  // =========================
  // LOAD NOTIFICATION SETTINGS
  // =========================
  useEffect(() => {
    if (!admin.id) return;

    const fetchNotificationPreferences = async () => {
      try {
        const token = getAdminToken();

        if (!token) {
          clearAdminSession();
          navigate("/admin/login", { replace: true });
          return;
        }

        const response = await fetch(
          `http://127.0.0.1:5000/api/auth/admin/notification-preferences?admin_id=${admin.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          clearAdminSession();
          navigate("/admin/login", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          console.error(
            data.message || "Failed to load notification preferences."
          );
          return;
        }

        setNotifications(
          Boolean(data.system_notifications)
        );

        setEmailNotifications(
          Boolean(data.email_notifications)
        );

      } catch (error) {
        console.error(
          "Error loading notification preferences:",
          error
        );
      }
    };

    fetchNotificationPreferences();
  }, [admin.id]);

  // =========================
  // SAVE NOTIFICATION SETTINGS
  // =========================
  const updateNotificationPreferences = async (
    systemValue,
    emailValue
  ) => {
    if (!admin.id) {
      setMessage(
        "Admin information not found. Please login again."
      );
      return;
    }

    try {
      const token = getAdminToken();

      if (!token) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/admin/notification-preferences",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            admin_id: admin.id,
            system_notifications: systemValue,
            email_notifications: emailValue,
          }),
        }
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to update notification preferences."
        );
        return;
      }

      setMessage(
        "Notification preferences updated successfully."
      );

    } catch (error) {
      console.error(
        "Notification update error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
    }
  };

  // =========================
  // SYSTEM NOTIFICATION TOGGLE
  // =========================
  const handleSystemNotificationChange = (e) => {
    const newValue = e.target.checked;

    setNotifications(newValue);

    updateNotificationPreferences(
      newValue,
      emailNotifications
    );
  };

  // =========================
  // EMAIL NOTIFICATION TOGGLE
  // =========================
  const handleEmailNotificationChange = (e) => {
    const newValue = e.target.checked;

    setEmailNotifications(newValue);

    updateNotificationPreferences(
      notifications,
      newValue
    );
  };

  // =========================
  // CHANGE PASSWORD
  // =========================
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !passwords.current ||
      !passwords.newPassword ||
      !passwords.confirm
    ) {
      setMessage("Please fill all password fields.");
      return;
    }

    if (
      passwords.newPassword !== passwords.confirm
    ) {
      setMessage(
        "New password and confirm password do not match."
      );
      return;
    }

    if (!admin.id) {
      setMessage(
        "Admin information not found. Please login again."
      );
      return;
    }

    try {
      setLoading(true);

      const token = getAdminToken();

      if (!token) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/admin/change-password",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            admin_id: admin.id,
            current_password: passwords.current,
            new_password: passwords.newPassword,
          }),
        }
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to change password."
        );
        return;
      }

      setMessage(
        data.message ||
          "Password updated successfully."
      );

      setPasswords({
        current: "",
        newPassword: "",
        confirm: "",
      });

    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    clearAdminSession();
    window.location.replace("/admin/login");
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Settings</h1>
        <p>
          Manage your admin account and preferences
        </p>
      </div>

      {/* =========================
          ADMIN PROFILE
      ========================= */}
      <div style={styles.card}>

        <div style={styles.sectionHeader}>

          <div style={styles.icon}>
            <FaUser />
          </div>

          <div>
            <h2>Admin Profile</h2>
            <p>
              Administrator account information
            </p>
          </div>

        </div>

        <div style={styles.profileBox}>

          <div style={styles.avatar}>
            {(admin.name || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <h3>
              {admin.name || "Admin Officer"}
            </h3>

            <p>
              {admin.email || "Administrator"}
            </p>

            {admin.phone && (
              <p>{admin.phone}</p>
            )}

          </div>

        </div>

      </div>

      {/* =========================
          CHANGE PASSWORD
      ========================= */}
      <div style={styles.card}>

        <div style={styles.sectionHeader}>

          <div style={styles.icon}>
            <FaLock />
          </div>

          <div>
            <h2>Change Password</h2>
            <p>
              Update your admin account password
            </p>
          </div>

        </div>

        <form onSubmit={handlePasswordChange}>

          <div style={styles.formGroup}>

            <label>Current Password</label>

            <input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  current: e.target.value,
                })
              }
              placeholder="Enter current password"
            />

          </div>

          <div style={styles.formGroup}>

            <label>New Password</label>

            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  newPassword: e.target.value,
                })
              }
              placeholder="Enter new password"
            />

          </div>

          <div style={styles.formGroup}>

            <label>Confirm New Password</label>

            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  confirm: e.target.value,
                })
              }
              placeholder="Confirm new password"
            />

          </div>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>

        </form>

      </div>

      {/* =========================
          NOTIFICATIONS
      ========================= */}
      <div style={styles.card}>

        <div style={styles.sectionHeader}>

          <div style={styles.icon}>
            <FaBell />
          </div>

          <div>
            <h2>
              Notification Preferences
            </h2>

            <p>
              Control your notification settings
            </p>
          </div>

        </div>

        {/* SYSTEM NOTIFICATIONS */}
        <div style={styles.settingRow}>

          <div>
            <strong>
              System Notifications
            </strong>

            <p>
              Receive notifications inside the portal
            </p>
          </div>

          <input
            type="checkbox"
            checked={notifications}
            onChange={
              handleSystemNotificationChange
            }
          />

        </div>

        {/* EMAIL NOTIFICATIONS */}
        <div style={styles.settingRow}>

          <div>
            <strong>
              Email Notifications
            </strong>

            <p>
              Receive important updates through email
            </p>
          </div>

          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={
              handleEmailNotificationChange
            }
          />

        </div>

      </div>

      {/* =========================
          LOGOUT
      ========================= */}
      <div style={styles.card}>

        <div style={styles.sectionHeader}>

          <div style={styles.logoutIcon}>
            <FaSignOutAlt />
          </div>

          <div>
            <h2>Logout</h2>

            <p>
              Sign out from the admin account
            </p>
          </div>

        </div>

        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          <FaSignOutAlt />
          Logout
        </button>

      </div>

    </div>
  );
}


// =========================
// STYLES
// =========================

const styles = {

  page: {
    minHeight: "100vh",
    padding: "30px",
    background: "#f5f7fb",
  },

  header: {
    marginBottom: "25px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "20px",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.06)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px",
  },

  icon: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    background: "#eef2ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  profileBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  avatar: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 700,
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "16px",
  },

  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom:
      "1px solid #e5e7eb",
  },

  primaryButton: {
    border: "none",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "#ffffff",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },

  logoutButton: {
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  message: {
    marginBottom: "15px",
    padding: "10px",
    borderRadius: "7px",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: "14px",
  },

};

export default Settings;