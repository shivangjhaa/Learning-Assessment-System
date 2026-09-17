import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { Badge, statusTone, Loader, EmptyState } from "../../components/UI";

export default function MyDocuments() {
  const [assignments, setAssignments] = useState(null);

  useEffect(() => {
    api.get("/assessment/my").then((res) => setAssignments(res.data.assignments));
  }, []);

  if (!assignments) return <Loader />;

  return (
    <div>
      <h1>My documents</h1>
      <p className="helper-text">Read each document fully, then pass the short quiz to earn your certificate.</p>

      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        {assignments.length === 0 ? (
          <EmptyState text="You have no documents assigned yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 600 }}>{a.document?.title}</td>
                    <td>{a.document?.department?.name}</td>
                    <td>{a.document?.category}</td>
                    <td>{a.document?.currentVersion?.versionNumber || "—"}</td>
                    <td>
                      <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                    </td>
                    <td>
                      {a.status === "completed" ? (
                        <span className="helper-text">Completed</span>
                      ) : (
                        <Link to={`/my/documents/${a.document?._id}/read`}>{a.completedAt ? "Re-complete (updated)" : "Start"}</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
