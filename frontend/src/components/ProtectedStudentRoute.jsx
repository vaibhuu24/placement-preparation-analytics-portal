import { Navigate, Outlet } from "react-router-dom";

function ProtectedStudentRoute() {
  const studentToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  if (!studentToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedStudentRoute;