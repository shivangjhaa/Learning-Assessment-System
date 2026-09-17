import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { ErrorText, Loader } from "../../components/UI";

export default function EditVersion() {
  const { id, versionId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/documents/${id}`).then((res) => {
      const all = [res.data.document.currentVersion, res.data.pendingVersion, ...res.data.versions].filter(Boolean);
      const version = all.find((v) => v._id === versionId);
      if (version) {
        setForm({
          versionNumber: version.versionNumber,
          minReadingTimeMinutes: version.minReadingTimeMinutes,
          versionNotes: version.versionNotes || "",
          status: version.status,
        });
      }
    });
  }, [id, versionId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/documents/versions/${versionId}`, {
        versionNumber: form.versionNumber,
        minReadingTimeMinutes: form.minReadingTimeMinutes,
        versionNotes: form.versionNotes,
      });
      navigate(`/documents/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <Loader />;

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Edit version {form.versionNumber}</h1>
      <p className="helper-text">
        Adjust the minimum reading time, version label, or change notes without re-uploading the file.
        {form.status === "published" && " This version is already published — changes apply immediately."}
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Version number</label>
          <input className="input" value={form.versionNumber} onChange={(e) => update("versionNumber", e.target.value)} required />
        </div>
        <div className="field">
          <label>Minimum reading time (minutes)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.minReadingTimeMinutes}
            onChange={(e) => update("minReadingTimeMinutes", e.target.value)}
          />
        </div>
        <div className="field">
          <label>What changed in this version (optional)</label>
          <textarea className="input" rows={2} value={form.versionNotes} onChange={(e) => update("versionNotes", e.target.value)} />
        </div>

        <ErrorText>{error}</ErrorText>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(`/documents/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
