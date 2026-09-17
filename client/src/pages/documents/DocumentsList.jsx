import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { Badge, statusTone, Loader, EmptyState } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";

export default function DocumentsList() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState(null);

  useEffect(() => {
    api.get("/documents").then((res) => setDocuments(res.data.documents));
  }, []);

  if (!documents) return <Loader />;

  return (
    <div>
      <div className="section-header">
        <h1>Documents</h1>
        {(user.role === "deptadmin" || user.role === "superadmin") && (
          <Link to="/documents/upload" className="btn">
            + Upload document
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {documents.length === 0 ? (
          <EmptyState text="No documents found yet." />
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
                {documents.map((doc) => (
                  <tr key={doc._id}>
                    <td style={{ fontWeight: 600 }}>{doc.title}</td>
                    <td>{doc.department?.name}</td>
                    <td>{doc.category}</td>
                    <td>{doc.currentVersion?.versionNumber || "—"}</td>
                    <td>
                      <Badge tone={statusTone(doc.status)}>{doc.status.replace("_", " ")}</Badge>
                    </td>
                    <td>
                      <Link to={`/documents/${doc._id}`}>Open</Link>
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
