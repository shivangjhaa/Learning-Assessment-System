import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { ErrorText, Loader } from "../../components/UI";

const CATEGORIES = ["SOP", "Policy", "Work Instruction", "Forms", "Templates", "Videos"];

export default function EditDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/documents/${id}`).then((res) => {
      const d = res.data.document;
      setForm({ title: d.title, category: d.category, description: d.description || "", departmentName: d.department?.name });
    });
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/documents/${id}`, { title: form.title, category: form.category, description: form.description });
      navigate(`/documents/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <Loader />;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Edit document</h1>
      <p className="helper-text">
        Update the title, category, or description. To change the file itself, upload a new version instead — every
        change to the actual content goes through approval.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Title</label>
          <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>
        <div className="field">
          <label>Department</label>
          <input className="input" value={form.departmentName} disabled />
          <span className="helper-text">Department can't be changed here — ask a Super Admin if this document is in the wrong department.</span>
        </div>
        <div className="field">
          <label>Category</label>
          <select className="input" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
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
