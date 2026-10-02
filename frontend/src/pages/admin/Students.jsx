import { useEffect, useState } from "react";

import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

function Students() {
  // Search and filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");

  // Add Student popup
  const [showModal, setShowModal] = useState(false);

  // Edit Student popup
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // Student form
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    department: "MCA",
    year: "MCA-II",
    status: "Unplaced",
  });

  // Students from MySQL
  const [students, setStudents] = useState([]);

  // Loading
  const [loading, setLoading] = useState(true);

  // =========================
  // GET STUDENTS FROM FLASK
  // =========================

  const fetchStudents = async () => {
    try {
      const token = sessionStorage.getItem("admin_access_token");

      console.log("ADMIN TOKEN EXISTS:", !!token);

      if (!token) {
        throw new Error("Admin token not found. Please login again.");
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/students",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch students");
      }

      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);

      alert(
        "Cannot connect to backend. Make sure Flask server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load students when page opens
  useEffect(() => {
    fetchStudents();
  }, []);

  // =========================
  // HANDLE FORM INPUT
  // =========================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewStudent({
      ...newStudent,
      [name]: value,
    });
  };

  // =========================
  // ADD STUDENT
  // =========================

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (
      !newStudent.name.trim() ||
      !newStudent.email.trim() ||
      !newStudent.phone.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("admin_access_token") ||
              sessionStorage.getItem("admin_access_token")
            }`,
          },
          body: JSON.stringify(newStudent),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to add student");
        return;
      }

      alert("Student added successfully!");

      // Reset form
      setNewStudent({
        name: "",
        email: "",
        phone: "",
        department: "MCA",
        year: "MCA-II",
        status: "Unplaced",
      });

      // Close popup
      setShowModal(false);

      // Get latest students from MySQL
      fetchStudents();

    } catch (error) {
      console.error("Error adding student:", error);

      alert(
        "Cannot connect to backend. Make sure Flask server is running."
      );
    }
  };

  // =========================
  // EDIT STUDENT
  // =========================

  const handleEditClick = (student) => {
    setEditingStudentId(student.id);

    setNewStudent({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      department: student.department || "MCA",
      year: student.year || "MCA-II",
      status: student.status || "Unplaced",
    });

    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();

    if (
      !newStudent.name.trim() ||
      !newStudent.email.trim() ||
      !newStudent.phone.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/students/${editingStudentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("admin_access_token") ||
              sessionStorage.getItem("admin_access_token")
            }`,
          },
          body: JSON.stringify(newStudent),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update student");
        return;
      }

      alert("Student updated successfully!");

      setShowEditModal(false);
      setEditingStudentId(null);

      setNewStudent({
        name: "",
        email: "",
        phone: "",
        department: "MCA",
        year: "MCA-II",
        status: "Unplaced",
      });

      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);

      alert(
        "Cannot connect to backend. Make sure Flask server is running."
      );
    }
  };

  // =========================
  // DELETE STUDENT
  // =========================

  const handleDeleteStudent = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/students/${id}`,
        {
          method: "DELETE",
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
        alert(data.error || "Failed to delete student");
        return;
      }

      alert("Student deleted successfully!");

      // Refresh student list
      fetchStudents();

    } catch (error) {
      console.error("Error deleting student:", error);

      alert(
        "Cannot connect to backend. Make sure Flask server is running."
      );
    }
  };

  // =========================
  // FILTER STUDENTS
  // =========================

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      student.email
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesDepartment =
      department === "All" ||
      student.department === department;

    const matchesStatus =
      status === "All" ||
      student.status === status;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus
    );
  });

  // =========================
  // STATISTICS
  // =========================

  const totalStudents = students.length;

  const placedStudents = students.filter(
    (student) => student.status === "Placed"
  ).length;

  const unplacedStudents = students.filter(
    (student) => student.status === "Unplaced"
  ).length;

  return (
    <div className="students-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="students-header">

        <div>
          <h1>Students</h1>

          <p>
            Manage and monitor all registered students.
          </p>
        </div>

        <button
          className="add-student-btn"
          onClick={() => setShowModal(true)}
        >
          <FaPlus />
          Add Student
        </button>

      </div>


      {/* =========================
          STATISTICS
      ========================= */}

      <div className="student-stats">

        <div className="student-stat-card">
          <span>Total Students</span>
          <strong>{totalStudents}</strong>
        </div>

        <div className="student-stat-card">
          <span>Placed</span>
          <strong>{placedStudents}</strong>
        </div>

        <div className="student-stat-card">
          <span>Unplaced</span>
          <strong>{unplacedStudents}</strong>
        </div>

      </div>


      {/* =========================
          FILTERS
      ========================= */}

      <div className="students-toolbar">

        <div className="student-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Search student name or email..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="student-filter">

          <FaFilter />

          <select
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
          >
            <option value="All">
              All Departments
            </option>

            <option value="MCA">MCA</option>
            <option value="BCA">BCA</option>
            <option value="BSc">BSc</option>
            <option value="MBA">MBA</option>
            <option value="BTech">BTech</option>

          </select>

        </div>


        <div className="student-filter">

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >

            <option value="All">
              All Status
            </option>

            <option value="Placed">
              Placed
            </option>

            <option value="Unplaced">
              Unplaced
            </option>

          </select>

        </div>

      </div>


      {/* =========================
          STUDENT TABLE
      ========================= */}

      <div className="students-table-card">

        <div className="table-title">

          <div>

            <h2>Student List</h2>

            <p>
              {filteredStudents.length} students found
            </p>

          </div>

        </div>


        <div className="students-table-wrapper">

          {loading ? (

            <div className="no-students">
              Loading students...
            </div>

          ) : (

            <table className="students-table">

              <thead>

                <tr>
                  <th>Student</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {filteredStudents.map((student) => (

                  <tr key={student.id}>

                    <td>

                      <div className="student-info">

                        <div className="student-avatar">

                          {student.name
                            .charAt(0)
                            .toUpperCase()}

                        </div>


                        <div>

                          <strong>
                            {student.name}
                          </strong>

                          <span>
                            {student.email}
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>
                      {student.phone}
                    </td>


                    <td>
                      {student.department}
                    </td>


                    <td>
                      {student.year}
                    </td>


                    <td>

                      <span
                        className={`student-status ${student.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {student.status}
                      </span>

                    </td>


                    <td>

                      <div className="student-actions">

                        <button title="View">
                          <FaEye />
                        </button>


                        <button
                          title="Edit"
                          onClick={() => handleEditClick(student)}
                        >
                          <FaEdit />
                        </button>


                        <button
                          title="Delete"
                          onClick={() =>
                            handleDeleteStudent(
                              student.id
                            )
                          }
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}


          {!loading &&
            filteredStudents.length === 0 && (
              <div className="no-students">
                No students found.
              </div>
            )}

        </div>


        {/* =========================
            PAGINATION
        ========================= */}

        <div className="students-pagination">

          <span>
            Showing 1–{filteredStudents.length} of{" "}
            {filteredStudents.length}
          </span>


          <div>

            <button>
              <FaChevronLeft />
            </button>

            <button className="active-page">
              1
            </button>

            <button>
              <FaChevronRight />
            </button>

          </div>

        </div>

      </div>


      {/* =========================
          ADD STUDENT POPUP
      ========================= */}

      {showModal && (

        <div className="student-modal-overlay">

          <div className="student-modal">


            {/* Modal Header */}

            <div className="student-modal-header">

              <div>

                <h2>
                  Add New Student
                </h2>

                <p>
                  Enter student information
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={handleAddStudent}
            >


              {/* Name */}

              <div className="form-group">

                <label>
                  Student Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter student name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  required
                />

              </div>


              {/* Email */}

              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={newStudent.email}
                  onChange={handleInputChange}
                  required
                />

              </div>


              {/* Phone */}

              <div className="form-group">

                <label>
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={newStudent.phone}
                  onChange={handleInputChange}
                  required
                />

              </div>


              {/* Department */}

              <div className="form-group">

                <label>
                  Department
                </label>

                <select
                  name="department"
                  value={newStudent.department}
                  onChange={handleInputChange}
                >

                  <option value="MCA">
                    MCA
                  </option>

                  <option value="BCA">
                    BCA
                  </option>

                  <option value="BSc">
                    BSc
                  </option>

                  <option value="MBA">
                    MBA
                  </option>

                  <option value="BTech">
                    BTech
                  </option>

                </select>

              </div>


              {/* Year */}

              <div className="form-group">

                <label>
                  Year
                </label>

                <select
                  name="year"
                  value={newStudent.year}
                  onChange={handleInputChange}
                >

                  <option value="MCA-I">
                    MCA-I
                  </option>

                  <option value="MCA-II">
                    MCA-II
                  </option>

                  <option value="BCA-III">
                    BCA-III
                  </option>

                  <option value="BSc-III">
                    BSc-III
                  </option>

                  <option value="MBA-II">
                    MBA-II
                  </option>

                  <option value="BTech-IV">
                    BTech-IV
                  </option>

                </select>

              </div>


              {/* Placement Status */}

              <div className="form-group">

                <label>
                  Placement Status
                </label>

                <select
                  name="status"
                  value={newStudent.status}
                  onChange={handleInputChange}
                >

                  <option value="Unplaced">
                    Unplaced
                  </option>

                  <option value="Placed">
                    Placed
                  </option>

                </select>

              </div>


              {/* Buttons */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-student-btn"
                >
                  Add Student
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================
          EDIT STUDENT POPUP
      ========================= */}

      {showEditModal && (
        <div className="student-modal-overlay">
          <div className="student-modal">

            <div className="student-modal-header">
              <div>
                <h2>Edit Student</h2>
                <p>Update student information</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateStudent}>

              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter student name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={newStudent.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={newStudent.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={newStudent.department}
                  onChange={handleInputChange}
                >
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="BSc">BSc</option>
                  <option value="MBA">MBA</option>
                  <option value="BTech">BTech</option>
                </select>
              </div>

              <div className="form-group">
                <label>Year</label>
                <select
                  name="year"
                  value={newStudent.year}
                  onChange={handleInputChange}
                >
                  <option value="MCA-I">MCA-I</option>
                  <option value="MCA-II">MCA-II</option>
                  <option value="BCA-III">BCA-III</option>
                  <option value="BSc-III">BSc-III</option>
                  <option value="MBA-II">MBA-II</option>
                  <option value="BTech-IV">BTech-IV</option>
                </select>
              </div>

              <div className="form-group">
                <label>Placement Status</label>
                <select
                  name="status"
                  value={newStudent.status}
                  onChange={handleInputChange}
                >
                  <option value="Unplaced">Unplaced</option>
                  <option value="Placed">Placed</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-student-btn"
                >
                  Update Student
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Students;