import { useEffect, useState } from "react";
import api from "../../api/client";
import { Loader, EmptyState } from "../../components/UI";

export default function MyCertificates() {
  const [certificates, setCertificates] = useState(null);

  useEffect(() => {
    api.get("/certificates/my").then((res) => setCertificates(res.data.certificates));
  }, []);

  if (!certificates) return <Loader />;

  return (
    <div>
      <h1>My certificates</h1>
      <p className="helper-text">Proof that you've read and understood each assigned document.</p>

      {certificates.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <EmptyState text="You haven't earned any certificates yet." />
        </div>
      ) : (
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {certificates.map((c) => (
            <div className="card" key={c._id}>
              <h3>{c.document?.title}</h3>
              <p className="helper-text" style={{ margin: "4px 0" }}>
                {c.document?.category} · v{c.documentVersion?.versionNumber}
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--success)", margin: "8px 0" }}>{c.score}%</p>
              <p className="helper-text" style={{ margin: 0 }}>
                Issued {new Date(c.issuedAt).toLocaleDateString()}
              </p>
              <p className="helper-text" style={{ margin: "4px 0 0 0" }}>
                Code: <code>{c.certificateCode}</code>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
