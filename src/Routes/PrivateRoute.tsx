import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
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
  return isAuthenticated ? (
    <Outlet />
    ) : (
    <Navigate to={`${process.env.PUBLIC_URL}/login`} />
  );
};

export default PrivateRoute;
