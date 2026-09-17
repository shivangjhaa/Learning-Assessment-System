import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { ErrorText } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = ["SOP", "Policy", "Work Instruction", "Forms", "Templates", "Videos"];

export default function UploadDocument() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: "",
    department: user.role === "deptadmin" ? user.department?._id || "" : "",
    category: "SOP",
    description: "",
    versionNumber: "1.0",
    minReadingTimeMinutes: 5,
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/departments").then((res) => {
      setDepartments(res.data.departments);
      if (user.role === "superadmin" && res.data.departments[0] && !form.department) {
        setForm((f) => ({ ...f, department: res.data.departments[0]._id }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("file", file);
      const res = await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/documents/${res.data.document._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1>Upload document</h1>
      <p className="helper-text">New uploads are sent to an approver for review before employees can see them.</p>

      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Title</label>
          <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>

        <div className="grid grid-2">
          <div className="field">
            <label>Department</label>
            {user.role === "deptadmin" ? (
              <>
                <input className="input" value={user.department?.name || "No department assigned"} disabled />
                <span className="helper-text">You can only upload documents for your own department.</span>
              </>
            ) : (
              <select className="input" value={form.department} onChange={(e) => update("department", e.target.value)} required>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
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
        </div>

        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        <div className="grid grid-2">
          <div className="field">
            <label>Version number</label>
            <input className="input" value={form.versionNumber} onChange={(e) => update("versionNumber", e.target.value)} />
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
        </div>

        <div className="field">
          <label>File (PDF, Word .docx, or video)</label>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files[0])} required />
        </div>

        <ErrorText>{error}</ErrorText>

        <button className="btn" type="submit" disabled={submitting} style={{ marginTop: 6 }}>
          {submitting ? "Uploading…" : "Submit for approval"}
        </button>
      </form>
    </div>
  );
}
