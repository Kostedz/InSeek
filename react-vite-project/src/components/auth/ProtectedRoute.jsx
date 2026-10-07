import {Navigate, useLocation} from "react-router-dom";
import Loading from "../Loading.jsx";

function normalizeRole(role) {
    return String(role ?? "").replace(/^ROLE_/, "").toUpperCase();
}

export default function ProtectedRoute({user, authChecked, allowedRoles, children}) {
    const location = useLocation();

    if (!authChecked) {
        return <Loading/>;
    }

    if (!user?.isLoggedIn) {
        return <Navigate to="/login" replace state={{from: location}}/>;
    }

    const hasRole = user?.isDevAccess || allowedRoles.includes(normalizeRole(user.role));
    if (!hasRole) {
        return <Navigate to="/error" replace state={{error: {status: 403}}}/>;
    }

    return children;
}
