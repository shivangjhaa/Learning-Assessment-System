import { useEffect, useState } from "react";
import api from "../../api/client";
import { Loader, ErrorText } from "../../components/UI";

const emptyForm = { name: "", code: "", description: "" };

export default function Departments() {
  const [departments, setDepartments] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.get("/departments");
    setDepartments(res.data.departments);
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/departments", form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(dept) {
    setEditingId(dept._id);
    setEditForm({ name: dept.name, code: dept.code, description: dept.description || "" });
    setRowError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setRowError("");
  }

  async function saveEdit(id) {
    setRowError("");
    try {
      await api.patch(`/departments/${id}`, editForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setRowError(err.response?.data?.message || "Failed to save changes.");
    }
  }

  async function handleDelete(dept) {
    setRowError("");
    if (!window.confirm(`Delete "${dept.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/departments/${dept._id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete department.");
    }
  }

  if (!departments) return <Loader />;

  return (
    <div>
      <h1>Departments</h1>
      <p className="helper-text">Departments organize documents and drive who is allowed to see what.</p>

      <div className="grid grid-2" style={{ alignItems: "start", marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) =>
                  editingId === d._id ? (
                    <tr key={d._id}>
                      <td>
                        <input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.code}
                          onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn small" onClick={() => saveEdit(d._id)} style={{ marginRight: 6 }}>
                          Save
                        </button>
                        <button className="btn secondary small" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={d._id}>
                      <td>{d.name}</td>
                      <td>{d.code}</td>
                      <td>{d.description || "—"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn secondary small" onClick={() => startEdit(d)} style={{ marginRight: 6 }}>
                          Edit
                        </button>
                        <button className="btn danger small" onClick={() => handleDelete(d)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <ErrorText>{rowError}</ErrorText>
        </div>

        <form className="card" onSubmit={handleCreate}>
          <h2>New department</h2>
          <div className="field">
            <label>Name</label>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="field">
            <label>Code</label>
            <input className="input" value={form.code} onChange={(e) => update("code", e.target.value.toUpperCase())} required />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <ErrorText>{error}</ErrorText>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create department"}
          </button>
        </form>
      </div>
    </div>
  );
}
