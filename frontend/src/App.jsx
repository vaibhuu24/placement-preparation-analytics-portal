import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =========================
// Student
// =========================
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCompanies from "./pages/student/StudentCompanies";
import StudentApplications from "./pages/student/Applications";
import StudentQuizzes from "./pages/student/StudentQuizzes";
import StudentQuizAttempt from "./pages/student/StudentQuizAttempt";
import StudentQuizResults from "./pages/student/StudentQuizResults";
import StudentProfile from "./pages/student/StudentProfile";

// =========================
// Admin
// =========================
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRegister from "./pages/admin/AdminRegister";
import Students from "./pages/admin/Students";
import Companies from "./pages/admin/Companies";
import Applications from "./pages/admin/Applications";
import Quizzes from "./pages/admin/Quizzes";
import AdminNotifications from "./pages/admin/AdminNotifications";
import Analytics from "./pages/admin/Analytics";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// =========================
// Route Protection
// =========================
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedStudentRoute from "./components/ProtectedStudentRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            DEFAULT
        ================================================== */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* ==================================================
            STUDENT AUTHENTICATION
        ================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ==================================================
            PROTECTED STUDENT PAGES
        ================================================== */}

        <Route element={<ProtectedStudentRoute />}>

          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />

          <Route
            path="/student/companies"
            element={<StudentCompanies />}
          />

          <Route
            path="/student/applications"
            element={<StudentApplications />}
          />

          <Route
            path="/student/quizzes/:quizId"
            element={<StudentQuizAttempt />}
          />

          <Route
            path="/student/quiz-results"
            element={<StudentQuizResults />}
          />

          <Route
            path="/student/profile"
            element={<StudentProfile />}
          />

          <Route
            path="/student/quizzes"
            element={<StudentQuizzes />}
          />

        </Route>

        {/* ==================================================
            ADMIN AUTHENTICATION
        ================================================== */}

        <Route
          path="/admin/register"
          element={<AdminRegister />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* ==================================================
            PROTECTED ADMIN PAGES
        ================================================== */}

        <Route element={<ProtectedAdminRoute />}>

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/students"
            element={<Students />}
          />

          <Route
            path="/admin/companies"
            element={<Companies />}
          />

          <Route
            path="/admin/applications"
            element={<Applications />}
          />

          <Route
            path="/admin/quizzes"
            element={<Quizzes />}
          />

          <Route
            path="/admin/notifications"
            element={<AdminNotifications />}
          />

          <Route
            path="/admin/analytics"
            element={<Analytics />}
          />

          <Route
            path="/admin/reports"
            element={<Reports />}
          />

          <Route
            path="/admin/settings"
            element={<Settings />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;