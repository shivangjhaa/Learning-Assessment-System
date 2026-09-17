import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { ErrorText } from "../../components/UI";

export default function UploadVersion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versionNumber, setVersionNumber] = useState("");
  const [minReadingTimeMinutes, setMinReadingTimeMinutes] = useState(5);
  const [versionNotes, setVersionNotes] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("versionNumber", versionNumber);
      fd.append("minReadingTimeMinutes", minReadingTimeMinutes);
      fd.append("versionNotes", versionNotes);
      fd.append("file", file);
      await api.post(`/documents/${id}/versions`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigate(`/documents/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload new version.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Upload new version</h1>
      <p className="helper-text">The previous version stays saved for audit purposes; this new version goes to the approver.</p>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Version number</label>
          <input className="input" placeholder="e.g. 2.0" value={versionNumber} onChange={(e) => setVersionNumber(e.target.value)} required />
        </div>
        <div className="field">
          <label>Minimum reading time (minutes)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={minReadingTimeMinutes}
            onChange={(e) => setMinReadingTimeMinutes(e.target.value)}
          />
        </div>
        <div className="field">
          <label>What changed in this version? (optional)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="e.g. Updated annual leave from 15 to 18 days"
            value={versionNotes}
            onChange={(e) => setVersionNotes(e.target.value)}
          />
        </div>
        <div className="field">
          <label>File</label>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
        <ErrorText>{error}</ErrorText>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Uploading…" : "Submit for approval"}
        </button>
      </form>
    </div>
  );
}
