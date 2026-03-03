// import { Navigate, useLocation } from 'react-router-dom'
// import { useAuth } from '../../contexts/auth/AuthContext'

// export default function RequireAuth({ children }) {
//     const location = useLocation()
//     const { userInfo } = useAuth()
//     console.log(userInfo)

//     if (!userInfo) {
//         return <Navigate to='/auth/signIn' replace state={{ from: location }} />
//     }

//     return children
// }

/* 
  RequireAuth.jsx (NOT USED YET)

  - Later you can wrap protected routes like:
      <Route element={<RequireAuth />}>
        <Route path="/teacher/dashboard" element={<Dashboard />} />
      </Route>

  - It will check token/role and redirect to /auth/sign-in
*/

// import { Navigate, Outlet } from "react-router-dom";

// export default function RequireAuth({ allowedRoles = [] }) {
//   // TODO: read token from localStorage/cookie
//   // const token = localStorage.getItem("token");
//   // const role = localStorage.getItem("role");

//   // if (!token) return <Navigate to="/auth/sign-in" replace />;
//   // if (allowedRoles.length && !allowedRoles.includes(role)) {
//   //   return <Navigate to="/auth/sign-in" replace />;
//   // }

//   // return <Outlet />;
// }
