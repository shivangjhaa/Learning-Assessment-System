import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { Loader, ErrorText } from "../../components/UI";
import FileViewer from "../../components/FileViewer";

export default function ReadDocument() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [minMinutes, setMinMinutes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const startRef = useRef(null);

  useEffect(() => {
    async function init() {
      const docRes = await api.get(`/documents/${documentId}`);
      setDoc(docRes.data.document);
      const startRes = await api.post("/assessment/read/start", { documentId });
      setAttempt(startRes.data.attempt);
      setMinMinutes(startRes.data.minReadingTimeMinutes);
      startRef.current = new Date(startRes.data.attempt.readStartedAt).getTime();
    }
    init();
  }, [documentId]);

  useEffect(() => {
    if (!startRef.current) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt]);

  async function handleComplete() {
    setError("");
    setCompleting(true);
    try {
      await api.post("/assessment/read/complete", { attemptId: attempt._id });
      navigate(`/my/documents/${documentId}/quiz`, { state: { attemptId: attempt._id } });
    } catch (err) {
      setError(err.response?.data?.message || "Not completed. Minimum reading time isn't finished.");
    } finally {
      setCompleting(false);
    }
  }

  if (!doc || !attempt) return <Loader />;

  const requiredSeconds = minMinutes * 60;
  const progress = requiredSeconds > 0 ? Math.min(100, Math.round((elapsed / requiredSeconds) * 100)) : 100;
  const remaining = Math.max(0, requiredSeconds - elapsed);
  const canComplete = elapsed >= requiredSeconds;

  return (
    <div>
      <h1>{doc.title}</h1>
      <p className="helper-text" style={{ margin: 0 }}>
        {doc.department?.name} · {doc.category} · Version {doc.currentVersion?.versionNumber}
      </p>

      <div className="card" style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Progress {progress}%</span>
          <span className="helper-text" style={{ margin: 0 }}>
            {canComplete ? "Minimum reading time reached" : `Time left: ${Math.ceil(remaining / 60)} min`}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <FileViewer
          documentId={documentId}
          versionId={doc.currentVersion?._id}
          path={doc.currentVersion?.filePath}
          fileType={doc.currentVersion?.fileType}
          fileName={doc.currentVersion?.fileName}
        />
      </div>

      <ErrorText>{error}</ErrorText>
      <button className="btn" disabled={!canComplete || completing} onClick={handleComplete}>
        {completing ? "Checking…" : canComplete ? "Complete reading — start assessment" : `Reading required for ${minMinutes} min`}
      </button>
    </div>
  );
}
