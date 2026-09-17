import { useEffect, useState } from "react";
import api from "../../api/client";
import { Loader, EmptyState } from "../../components/UI";

export default function AuditTrail() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    api.get("/audit").then((res) => setLogs(res.data.logs));
  }, []);

  if (!logs) return <Loader />;

  return (
    <div>
      <h1>Audit trail</h1>
      <p className="helper-text">Every login, upload, review, reading session and assessment is recorded here.</p>

      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        {logs.length === 0 ? (
          <EmptyState text="No activity recorded yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.user?.name || "System"}</td>
                    <td>{log.action.replaceAll("_", " ")}</td>
                    <td>{log.details}</td>
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
