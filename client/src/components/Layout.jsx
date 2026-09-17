import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_BY_ROLE = {
  superadmin: [
    { to: "/", label: "Dashboard" },
    { to: "/documents", label: "Documents" },
    { to: "/documents/upload", label: "Upload Document" },
    { to: "/approvals", label: "Approvals" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/departments", label: "Departments" },
    { to: "/audit", label: "Audit Trail" },
  ],
  deptadmin: [
    { to: "/", label: "Dashboard" },
    { to: "/documents", label: "Documents" },
    { to: "/documents/upload", label: "Upload Document" },
  ],
  approver: [
    { to: "/", label: "Dashboard" },
    { to: "/documents", label: "Documents" },
    { to: "/approvals", label: "Approvals" },
  ],
  employee: [
    { to: "/", label: "Dashboard" },
    { to: "/my/documents", label: "My Documents" },
    { to: "/my/certificates", label: "My Certificates" },
  ],
  auditor: [
    { to: "/", label: "Dashboard" },
    { to: "/documents", label: "Documents" },
    { to: "/audit", label: "Audit Trail" },
  ],
};

const ROLE_LABEL = {
  superadmin: "Super Admin",
  deptadmin: "Department Admin",
  approver: "Approver",
  employee: "Employee",
  auditor: "Auditor",
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="name">ADM Knowledge Repository</div>
          <div className="sub">Learning &amp; Compliance</div>
        </div>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            {item.label}
          </NavLink>
        ))}
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div />
          <div className="user-chip">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{user?.name}</div>
              <div className="role-tag">{ROLE_LABEL[user?.role] || user?.role}</div>
            </div>
            <div className="avatar">{initials}</div>
            <button className="btn secondary small" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
