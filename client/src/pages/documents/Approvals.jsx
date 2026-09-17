import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { Loader, EmptyState } from "../../components/UI";

export default function Approvals() {
  const [versions, setVersions] = useState(null);

  useEffect(() => {
    api.get("/documents/pending/approvals").then((res) => setVersions(res.data.versions));
  }, []);

  if (!versions) return <Loader />;

  return (
    <div>
      <h1>Pending approvals</h1>
      <p className="helper-text">Documents waiting for your review before they become visible to employees.</p>

      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        {versions.length === 0 ? (
          <EmptyState text="Nothing pending review right now." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Department</th>
                  <th>Version</th>
                  <th>Uploaded by</th>
                  <th>Uploaded on</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 600 }}>{v.document?.title}</td>
                    <td>{v.document?.department?.name}</td>
                    <td>{v.versionNumber}</td>
                    <td>{v.uploadedBy?.name}</td>
                    <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/documents/${v.document?._id}`}>Review</Link>
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
