import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { StatCard, Loader } from "../components/UI";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setStats(res.data.stats));
  }, []);

  if (!stats) return <Loader />;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Welcome, {user.name.split(" ")[0]}</h1>
          <p className="helper-text" style={{ margin: 0 }}>
            Here's what's happening in your knowledge repository today.
          </p>
        </div>
      </div>

      {user.role === "superadmin" && (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <StatCard label="Employees" value={stats.employees} />
          <StatCard label="Documents" value={stats.documents} />
          <StatCard label="Pending Reviews" value={stats.pendingReviews} />
          <StatCard label="Certificates" value={stats.certificates} />
          <StatCard label="Failed Assessments" value={stats.failedAssessments} />
        </div>
      )}

      {user.role === "deptadmin" && (
        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <StatCard label="Department Documents" value={stats.documents} />
          <StatCard label="Published" value={stats.published} />
          <StatCard label="Pending Approval" value={stats.pendingReviews} />
        </div>
      )}

      {user.role === "approver" && (
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <StatCard label="Pending Reviews" value={stats.pendingReviews} />
          <StatCard label="Reviewed By You" value={stats.approvedCount} />
        </div>
      )}

      {user.role === "employee" && (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <StatCard label="Documents Assigned" value={stats.assigned} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Certificates" value={stats.certificates} />
        </div>
      )}

      {user.role === "auditor" && (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <StatCard label="Employees" value={stats.employees} />
          <StatCard label="Certificates Issued" value={stats.certificates} />
          <StatCard label="Total Assessments" value={stats.totalAttempts} />
          <StatCard label="Failed Assessments" value={stats.failedAssessments} />
        </div>
      )}

      <div className="card">
        <h2>Quick actions</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          {(user.role === "deptadmin" || user.role === "superadmin") && (
            <button className="btn" onClick={() => navigate("/documents/upload")}>
              Upload a document
            </button>
          )}
          {(user.role === "approver" || user.role === "superadmin") && (
            <button className="btn secondary" onClick={() => navigate("/approvals")}>
              Review pending approvals
            </button>
          )}
          {user.role === "employee" && (
            <button className="btn" onClick={() => navigate("/my/documents")}>
              View my assigned documents
            </button>
          )}
          {(user.role === "auditor" || user.role === "superadmin") && (
            <button className="btn secondary" onClick={() => navigate("/audit")}>
              Open audit trail
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
