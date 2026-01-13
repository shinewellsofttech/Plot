import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import LayoutRoutes from "./LayoutRoutes";
import Login from "../Component/Authentication/Login";
import LandingPage from "../Component/Authentication/LandingPage";

const RouterData = () => {
  const storedUser = sessionStorage.getItem("authUser");
  let isAuthenticated = false;
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      isAuthenticated = Number(parsedUser?.Id) > 0;
    } catch (error) {
      console.error("Invalid authUser in sessionStorage", error);
      isAuthenticated = false;
    }
  }
  return (
    <BrowserRouter basename={"/"}>
      <Routes>
        {/* Root path - Always show Landing Page first */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={`${process.env.PUBLIC_URL}/emiReport`} replace />
            ) : (
              <LandingPage />
            )
          }
        />
        {/* Login route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={`${process.env.PUBLIC_URL}/emiReport`} replace />
            ) : (
              <Login />
            )
          }
        />
        {/* Protected routes */}
        <Route path="/" element={<PrivateRoute />}>
          <Route path={`/*`} element={<LayoutRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default RouterData;
