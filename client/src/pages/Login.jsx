import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorText } from "../components/UI";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-brand">
          <div className="mark">ADM</div>
          <h1>Knowledge Repository</h1>
          <p className="helper-text">Sign in with your company account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@adm.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <ErrorText>{error}</ErrorText>
          <button className="btn block" type="submit" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="demo-creds">
          Demo accounts (password <code>Password123!</code>):<br />
          <code>superadmin@adm.com</code> · <code>deptadmin@adm.com</code> · <code>approver@adm.com</code> ·{" "}
          <code>employee@adm.com</code> · <code>employee.it@adm.com</code> · <code>auditor@adm.com</code>
        </div>
      </div>
    </div>
  );
}
