import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaGraduationCap,
  FaBook,
  FaPhone,
  FaChartLine,
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

function StudentProfile() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    branch: "",
    currentYear: "",
    cgpa: "",
    backlogs: "",
    phone: "",
  });

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("student") ||
      sessionStorage.getItem("student");

    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!savedStudent || !token) {
      localStorage.removeItem("student");
      sessionStorage.removeItem("student");
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");

      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsedStudent = JSON.parse(savedStudent);

      setStudent(parsedStudent);

      setFormData({
        branch: parsedStudent.branch || "",
        currentYear: parsedStudent.currentYear || "",
        cgpa: parsedStudent.cgpa ?? "",
        backlogs: parsedStudent.backlogs ?? "",
        phone: parsedStudent.phone || "",
      });
    } catch (error) {
      console.error("Student data error:", error);

      localStorage.removeItem("student");
      sessionStorage.removeItem("student");
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");

      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const currentYear = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
    5: "Fifth Year",
  };

  /* ==========================================
     INPUT CHANGE
  ========================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ==========================================
     EDIT PROFILE
  ========================================== */

  const handleEdit = () => {
    setFormData({
      branch: student.branch || "",
      currentYear: student.currentYear || "",
      cgpa: student.cgpa ?? "",
      backlogs: student.backlogs ?? "",
      phone: student.phone || "",
    });

    setEditMode(true);
  };

  /* ==========================================
     CANCEL EDIT
  ========================================== */

  const handleCancel = () => {
    setFormData({
      branch: student.branch || "",
      currentYear: student.currentYear || "",
      cgpa: student.cgpa ?? "",
      backlogs: student.backlogs ?? "",
      phone: student.phone || "",
    });

    setEditMode(false);
  };

  /* ==========================================
     SAVE PROFILE
  ========================================== */

  const handleSave = async () => {
    if (!student?.id) {
      alert("Student information not found.");
      return;
    }

    if (!formData.branch.trim()) {
      alert("Please enter your branch.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    const currentYearValue = Number(formData.currentYear);
    const cgpaValue = Number(formData.cgpa);
    const backlogsValue = Number(formData.backlogs);

    if (
      !currentYearValue ||
      currentYearValue < 1 ||
      currentYearValue > 5
    ) {
      alert("Current year must be between 1 and 5.");
      return;
    }

    if (
      Number.isNaN(cgpaValue) ||
      cgpaValue < 0 ||
      cgpaValue > 10
    ) {
      alert("CGPA must be between 0 and 10.");
      return;
    }

    if (
      Number.isNaN(backlogsValue) ||
      backlogsValue < 0
    ) {
      alert("Backlogs cannot be negative.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!token) {
      localStorage.removeItem("student");
      sessionStorage.removeItem("student");
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");

      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/student/profile/${student.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branch: formData.branch,
            currentYear: currentYearValue,
            cgpa: cgpaValue,
            backlogs: backlogsValue,
            phone: formData.phone,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("student");
        sessionStorage.removeItem("student");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update profile."
        );
      }

      const updatedStudent = data.student;

      setStudent(updatedStudent);

      setFormData({
        branch: updatedStudent.branch || "",
        currentYear: updatedStudent.currentYear || "",
        cgpa: updatedStudent.cgpa ?? "",
        backlogs: updatedStudent.backlogs ?? "",
        phone: updatedStudent.phone || "",
      });

      /*
        Update localStorage/sessionStorage so
        dashboard also shows the latest information.
      */

      if (localStorage.getItem("student")) {
        localStorage.setItem(
          "student",
          JSON.stringify(updatedStudent)
        );
      }

      if (sessionStorage.getItem("student")) {
        sessionStorage.setItem(
          "student",
          JSON.stringify(updatedStudent)
        );
      }

      setEditMode(false);

      alert(
        data.message ||
          "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      alert(
        error.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (!student) {
    return (
      <div style={loadingStyle}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={pageStyle}>

      {/* ==========================================
          HEADER
      ========================================== */}

      <div style={headerStyle}>

        <div>
          <h1 style={headingStyle}>
            My Profile
          </h1>

          <p style={subHeadingStyle}>
            View and update your academic information
          </p>
        </div>

        <div style={headerButtonsStyle}>

          {!editMode ? (
            <button
              style={editButtonStyle}
              onClick={handleEdit}
            >
              <FaEdit />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                style={saveButtonStyle}
                onClick={handleSave}
                disabled={saving}
              >
                <FaSave />

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                style={cancelButtonStyle}
                onClick={handleCancel}
                disabled={saving}
              >
                <FaTimes />
                Cancel
              </button>
            </>
          )}

          <button
            style={backButtonStyle}
            onClick={() =>
              navigate("/student/dashboard")
            }
          >
            <FaArrowLeft />
            Dashboard
          </button>

          <button
            style={logoutButtonStyle}
            onClick={() => {
              localStorage.removeItem("student");
              sessionStorage.removeItem("student");
              localStorage.removeItem("access_token");
              sessionStorage.removeItem("access_token");
              window.location.replace("/login");
            }}
          >
            Logout
          </button>

        </div>

      </div>

      {/* ==========================================
          PROFILE CARD
      ========================================== */}

      <div style={profileCardStyle}>

        {/* PROFILE HEADER */}

        <div style={profileHeaderStyle}>

          <div style={avatarStyle}>
            {student.studentName
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <h2 style={nameStyle}>
              {student.studentName}
            </h2>

            <p style={departmentStyle}>
              {student.department}
            </p>
          </div>

          <div style={statusStyle}>
            <FaCheckCircle />

            {student.placementStatus ||
              "Unplaced"}
          </div>

        </div>

        {/* ==========================================
            INFORMATION
        ========================================== */}

        <div style={profileGridStyle}>

          {/* Student Name */}

          <ProfileItem
            icon={<FaUser />}
            label="Student Name"
            value={student.studentName}
          />

          {/* Email */}

          <ProfileItem
            icon={<FaEnvelope />}
            label="College Email"
            value={student.email}
          />

          {/* Roll Number */}

          <ProfileItem
            icon={<FaIdCard />}
            label="Roll Number"
            value={student.rollNumber}
          />

          {/* PRN */}

          <ProfileItem
            icon={<FaIdCard />}
            label="PRN"
            value={student.prn || "N/A"}
          />

          {/* Department */}

          <ProfileItem
            icon={<FaGraduationCap />}
            label="Department"
            value={student.department}
          />

          {/* Branch */}

          {editMode ? (
            <EditableItem
              icon={<FaBook />}
              label="Branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              type="text"
            />
          ) : (
            <ProfileItem
              icon={<FaBook />}
              label="Branch"
              value={student.branch}
            />
          )}

          {/* Current Year */}

          {editMode ? (
            <EditableItem
              icon={<FaGraduationCap />}
              label="Current Year"
              name="currentYear"
              value={formData.currentYear}
              onChange={handleChange}
              type="select"
            />
          ) : (
            <ProfileItem
              icon={<FaGraduationCap />}
              label="Current Year"
              value={
                currentYear[
                  student.currentYear
                ] ||
                student.currentYear ||
                "N/A"
              }
            />
          )}

          {/* CGPA */}

          {editMode ? (
            <EditableItem
              icon={<FaChartLine />}
              label="CGPA"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleChange}
              type="number"
              min="0"
              max="10"
              step="0.01"
            />
          ) : (
            <ProfileItem
              icon={<FaChartLine />}
              label="CGPA"
              value={student.cgpa ?? "N/A"}
            />
          )}

          {/* Backlogs */}

          {editMode ? (
            <EditableItem
              icon={<FaBook />}
              label="Backlogs"
              name="backlogs"
              value={formData.backlogs}
              onChange={handleChange}
              type="number"
              min="0"
              step="1"
            />
          ) : (
            <ProfileItem
              icon={<FaBook />}
              label="Backlogs"
              value={student.backlogs ?? "N/A"}
            />
          )}

          {/* Phone */}

          {editMode ? (
            <EditableItem
              icon={<FaPhone />}
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
            />
          ) : (
            <ProfileItem
              icon={<FaPhone />}
              label="Phone Number"
              value={student.phone || "N/A"}
            />
          )}

        </div>

      </div>

    </div>
  );
}


/* ==========================================
   PROFILE ITEM
========================================== */

function ProfileItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={profileItemStyle}>

      <div style={iconBoxStyle}>
        {icon}
      </div>

      <div>
        <span style={labelStyle}>
          {label}
        </span>

        <strong style={valueStyle}>
          {value || "N/A"}
        </strong>
      </div>

    </div>
  );
}


/* ==========================================
   EDITABLE ITEM
========================================== */

function EditableItem({
  icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
}) {
  return (
    <div style={profileItemStyle}>

      <div style={iconBoxStyle}>
        {icon}
      </div>

      <div style={editableContentStyle}>

        <span style={labelStyle}>
          {label}
        </span>

        {type === "select" ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            style={inputStyle}
          >
            <option value="">
              Select Year
            </option>

            <option value="1">
              First Year
            </option>

            <option value="2">
              Second Year
            </option>

            <option value="3">
              Third Year
            </option>

            <option value="4">
              Fourth Year
            </option>

            <option value="5">
              Fifth Year
            </option>
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            style={inputStyle}
          />
        )}

      </div>

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

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
  gap: "20px",
};

const headerButtonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
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

const editButtonStyle = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
};

const saveButtonStyle = {
  border: "none",
  background: "#059669",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
};

const cancelButtonStyle = {
  border: "none",
  background: "#dc2626",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
};

const backButtonStyle = {
  border: "none",
  background: "#111827",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
};

const logoutButtonStyle = {
  border: "none",
  background: "#dc2626",
  color: "#fff",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
};

const profileCardStyle = {
  background: "#fff",
  borderRadius: "14px",
  padding: "30px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
};

const profileHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  paddingBottom: "25px",
  marginBottom: "25px",
  borderBottom: "1px solid #e5e7eb",
};

const avatarStyle = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "#2563eb",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "700",
};

const nameStyle = {
  margin: 0,
  color: "#111827",
};

const departmentStyle = {
  margin: "6px 0 0",
  color: "#6b7280",
};

const statusStyle = {
  marginLeft: "auto",
  background: "#ecfdf5",
  color: "#059669",
  padding: "8px 14px",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  fontWeight: "600",
};

const profileGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const profileItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "18px",
};

const iconBoxStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "8px",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const labelStyle = {
  display: "block",
  color: "#6b7280",
  fontSize: "12px",
  marginBottom: "5px",
};

const valueStyle = {
  color: "#111827",
  fontSize: "15px",
};

const editableContentStyle = {
  flex: 1,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  padding: "9px 10px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  background: "#fff",
};

export default StudentProfile;