import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import LayoutRoutes from "./LayoutRoutes";
import Login from "../Component/Authentication/Login";

const RouterData = () => {
  const storedUser = localStorage.getItem("authUser");
  let isAuthenticated = false;
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      isAuthenticated = Number(parsedUser?.Id) > 0;
    } catch (error) {
      console.error("Invalid authUser in localStorage", error);
      isAuthenticated = false;
    }
  }
  return (
    <BrowserRouter basename={"/"}>
      <Routes>
        <Route
          path={`${process.env.PUBLIC_URL}` || "/"}
          element={
            isAuthenticated ? (
              <Navigate to={`${process.env.PUBLIC_URL}/emiReport`} />
            ) : (
              <Navigate to={`${process.env.PUBLIC_URL}/login`} />
            )
          }
        />
        <Route path={"/"} element={<PrivateRoute />}>
          <Route path={`/*`} element={<LayoutRoutes />} />
        </Route>
        <Route
          path={`${process.env.PUBLIC_URL}/login`}
          element={
            isAuthenticated ? <Navigate to={`${process.env.PUBLIC_URL}/emiReport`} /> : <Login />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterData;
