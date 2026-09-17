import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { fileUrl } from "../../api/client";
import { Badge, statusTone, Loader, ErrorText } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";
import FileViewer from "../../components/FileViewer";

export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [pendingVersion, setPendingVersion] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [previewingVersionId, setPreviewingVersionId] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  async function load() {
    const res = await api.get(`/documents/${id}`);
    setDocument(res.data.document);
    setVersions(res.data.versions);
    setPendingVersion(res.data.pendingVersion);

    const quizTargetVersion = res.data.pendingVersion || res.data.document.currentVersion;
    if (quizTargetVersion) {
      try {
        const qres = await api.get(`/quizzes/version/${quizTargetVersion._id}`);
        setQuiz(qres.data.quiz);
      } catch {
        setQuiz(null);
      }
    } else {
      setQuiz(null);
    }

    if (!departments.length) {
      const dres = await api.get("/departments");
      setDepartments(dres.data.departments);
      // default: the document's own department is pre-selected
      setSelectedDeptIds([String(res.data.document.department._id)]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleReview(decision) {
    setError("");
    setReviewing(true);
    try {
      const res = await api.patch(`/documents/versions/${pendingVersion._id}/review`, {
        decision,
        comment: reviewComment,
      });
      let msg =
        decision === "approve"
          ? `Version ${pendingVersion.versionNumber} approved and published.`
          : `Version ${pendingVersion.versionNumber} rejected.`;
      if (res.data.reopenedCount > 0) {
        msg += ` ${res.data.reopenedCount} employee(s) who had already completed the old version must now re-complete it.`;
      }
      setNotice(msg);
      setReviewComment("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewing(false);
    }
  }

  function toggleDept(deptId) {
    setSelectedDeptIds((prev) => (prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]));
  }

  async function handleAssign() {
    setError("");
    if (selectedDeptIds.length === 0) {
      setError("Select at least one department to assign to.");
      return;
    }
    setAssigning(true);
    try {
      const res = await api.post(`/documents/${id}/assign`, { departmentIds: selectedDeptIds });
      setNotice(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign document.");
    } finally {
      setAssigning(false);
    }
  }

  if (!document) return <Loader />;

  const canReview = !!pendingVersion && (user.role === "approver" || user.role === "superadmin");
  const canManage =
    user.role === "superadmin" || (user.role === "deptadmin" && String(document.department?._id) === String(user.department?._id));

  return (
    <div>
      <Link to="/documents" className="helper-text">
        ← Back to documents
      </Link>
      <div className="section-header" style={{ marginTop: 8 }}>
        <div>
          <h1>{document.title}</h1>
          <p className="helper-text" style={{ margin: 0 }}>
            {document.department?.name} · {document.category}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone={statusTone(document.status)}>{document.status.replace("_", " ")}</Badge>
          {canManage && (
            <Link to={`/documents/${id}/edit`} className="btn secondary small">
              Edit document
            </Link>
          )}
        </div>
      </div>

      {notice && <div className="card" style={{ marginBottom: 16, borderColor: "var(--success)" }}>{notice}</div>}
      <ErrorText>{error}</ErrorText>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div>
          {pendingVersion && (
            <div className="card" style={{ marginBottom: 16, borderColor: "var(--warning)" }}>
              <div className="section-header">
                <h2>Version awaiting review</h2>
                <Badge tone="amber">pending approval</Badge>
              </div>
              <p>
                Version {pendingVersion.versionNumber} · Minimum reading time {pendingVersion.minReadingTimeMinutes} min
              </p>
              {pendingVersion.versionNotes && <p className="helper-text">What changed: {pendingVersion.versionNotes}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <a href={fileUrl(pendingVersion.filePath)} target="_blank" rel="noreferrer" className="btn secondary small">
                  View file
                </a>
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => setPreviewingVersionId(previewingVersionId === pendingVersion._id ? null : pendingVersion._id)}
                >
                  {previewingVersionId === pendingVersion._id ? "Hide preview" : "Preview here"}
                </button>
                {canManage && (
                  <Link to={`/documents/${id}/versions/${pendingVersion._id}/edit`} className="btn secondary small">
                    Edit reading time / notes
                  </Link>
                )}
              </div>
              {previewingVersionId === pendingVersion._id && (
                <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  <FileViewer
                    documentId={id}
                    versionId={pendingVersion._id}
                    path={pendingVersion.filePath}
                    fileType={pendingVersion.fileType}
                    fileName={pendingVersion.fileName}
                    height="50vh"
                  />
                </div>
              )}

              {canReview && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <h3>Review this submission</h3>
                  <div className="field">
                    <label>Comment (optional)</label>
                    <textarea className="input" rows={2} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn success" disabled={reviewing} onClick={() => handleReview("approve")}>
                      Approve &amp; publish v{pendingVersion.versionNumber}
                    </button>
                    <button className="btn danger" disabled={reviewing} onClick={() => handleReview("reject")}>
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Currently published version</h2>
            {document.currentVersion ? (
              <>
                <p>
                  Version {document.currentVersion.versionNumber} · Minimum reading time {document.currentVersion.minReadingTimeMinutes} min
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={fileUrl(document.currentVersion.filePath)} target="_blank" rel="noreferrer" className="btn secondary small">
                    View file
                  </a>
                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={() =>
                      setPreviewingVersionId(previewingVersionId === document.currentVersion._id ? null : document.currentVersion._id)
                    }
                  >
                    {previewingVersionId === document.currentVersion._id ? "Hide preview" : "Preview here"}
                  </button>
                  {canManage && (
                    <Link to={`/documents/${id}/versions/${document.currentVersion._id}/edit`} className="btn secondary small">
                      Edit reading time
                    </Link>
                  )}
                </div>
                {previewingVersionId === document.currentVersion._id && (
                  <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                    <FileViewer
                      documentId={id}
                      versionId={document.currentVersion._id}
                      path={document.currentVersion.filePath}
                      fileType={document.currentVersion.fileType}
                      fileName={document.currentVersion.fileName}
                      height="50vh"
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="helper-text">No version has been approved yet — nothing is visible to employees.</p>
            )}

            {document.description && (
              <>
                <h3 style={{ marginTop: 16 }}>Description</h3>
                <p>{document.description}</p>
              </>
            )}
          </div>

          {canManage && document.status === "published" && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3>Assign to employees</h3>
              <p className="helper-text">
                Select every department that should receive this document — not just its home department. Employees in
                selected departments will see it on their dashboard.
              </p>
              <div style={{ margin: "10px 0" }}>
                {departments.map((d) => (
                  <div className="checkbox-row" key={d._id}>
                    <input
                      type="checkbox"
                      id={`dept-${d._id}`}
                      checked={selectedDeptIds.includes(String(d._id))}
                      onChange={() => toggleDept(String(d._id))}
                    />
                    <label htmlFor={`dept-${d._id}`}>
                      {d.name}
                      {String(d._id) === String(document.department._id) && (
                        <span className="helper-text"> (document's own department)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              <button className="btn secondary" onClick={handleAssign} disabled={assigning}>
                {assigning ? "Assigning…" : "Assign to selected departments"}
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Version history</h2>
          {versions.length === 0 ? (
            <p className="helper-text">No versions yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v._id}>
                    <td>{v.versionNumber}</td>
                    <td>
                      <Badge tone={statusTone(v.status)}>{v.status.replace("_", " ")}</Badge>
                    </td>
                    <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canManage && !pendingVersion && (
            <div style={{ marginTop: 14 }}>
              <Link to={`/documents/${id}/new-version`} className="btn secondary small">
                + Upload new version
              </Link>
            </div>
          )}
          {canManage && pendingVersion && (
            <p className="helper-text" style={{ marginTop: 14 }}>
              A version is already awaiting review — it must be approved or rejected before you can upload another.
            </p>
          )}
        </div>
      </div>

      {canManage && (pendingVersion || document.currentVersion) && (
        <div className="card">
          <div className="section-header">
            <h2>Assessment quiz</h2>
            <Link to={`/documents/${id}/quiz`} className="btn secondary small">
              {quiz ? "Edit quiz" : "Create quiz"}
            </Link>
          </div>
          <p className="helper-text" style={{ margin: "0 0 8px 0" }}>
            {pendingVersion
              ? `This quiz applies to version ${pendingVersion.versionNumber} (awaiting review).`
              : `This quiz applies to the current published version ${document.currentVersion?.versionNumber}.`}
          </p>
          {quiz ? (
            <p className="helper-text">
              {quiz.questions.length} question(s) · pass mark {quiz.passPercentage}%
            </p>
          ) : (
            <p className="helper-text">No quiz configured yet — employees cannot complete this document without one.</p>
          )}
        </div>
      )}
    </div>
  );
}
