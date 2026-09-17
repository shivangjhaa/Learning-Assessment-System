import { useEffect, useState } from "react";
import api from "../../api/client";
import { Badge, Loader, ErrorText } from "../../components/UI";

const ROLES = ["superadmin", "deptadmin", "approver", "employee", "auditor"];

export default function Users() {
  const [users, setUsers] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee", department: "" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "employee", department: "" });
  const [rowError, setRowError] = useState("");

  async function load() {
    const [uRes, dRes] = await Promise.all([api.get("/users"), api.get("/departments")]);
    setUsers(uRes.data.users);
    setDepartments(dRes.data.departments);
    if (dRes.data.departments[0]) setForm((f) => ({ ...f, department: dRes.data.departments[0]._id }));
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
    setCreating(true);
    try {
      await api.post("/users", form);
      setForm((f) => ({ ...f, name: "", email: "", password: "" }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(user) {
    await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
    await load();
  }

  function startEdit(user) {
    setEditingId(user._id);
    setEditForm({ name: user.name, role: user.role, department: user.department?._id || "" });
    setRowError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setRowError("");
  }

  async function saveEdit(id) {
    setRowError("");
    try {
      await api.patch(`/users/${id}`, { name: editForm.name, role: editForm.role, department: editForm.department || null });
      setEditingId(null);
      await load();
    } catch (err) {
      setRowError(err.response?.data?.message || "Failed to save changes.");
    }
  }

  if (!users) return <Loader />;

  return (
    <div>
      <h1>Users</h1>
      <p className="helper-text">Create accounts, and edit a person's name, role, or department as their job changes.</p>

      <div className="grid grid-2" style={{ alignItems: "start", marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) =>
                  editingId === u._id ? (
                    <tr key={u._id}>
                      <td>
                        <input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                      </td>
                      <td className="helper-text">{u.email}</td>
                      <td>
                        <select className="input" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="input"
                          value={editForm.department}
                          onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                        >
                          <option value="">None</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "active" : "disabled"}</Badge>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn small" onClick={() => saveEdit(u._id)} style={{ marginRight: 6 }}>
                          Save
                        </button>
                        <button className="btn secondary small" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <Badge tone="blue">{u.role}</Badge>
                      </td>
                      <td>{u.department?.name || "—"}</td>
                      <td>
                        <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "active" : "disabled"}</Badge>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn secondary small" onClick={() => startEdit(u)} style={{ marginRight: 6 }}>
                          Edit
                        </button>
                        <button className="btn secondary small" onClick={() => toggleActive(u)}>
                          {u.isActive ? "Disable" : "Enable"}
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
          <h2>New user</h2>
          <div className="field">
            <label>Full name</label>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div className="field">
            <label>Temporary password</label>
            <input className="input" type="text" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label>Role</label>
              <select className="input" value={form.role} onChange={(e) => update("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Department</label>
              <select className="input" value={form.department} onChange={(e) => update("department", e.target.value)}>
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ErrorText>{error}</ErrorText>
          <button className="btn" type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}
