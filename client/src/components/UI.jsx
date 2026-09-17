export function Badge({ children, tone = "gray" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function statusTone(status) {
  const map = {
    draft: "gray",
    pending_approval: "amber",
    approved: "blue",
    published: "green",
    rejected: "red",
    pending: "amber",
    completed: "green",
  };
  return map[status] || "gray";
}

export function StatCard({ label, value }) {
  return (
    <div className="card stat-card">
      <span className="label">{label}</span>
      <span className="value">{value ?? "—"}</span>
    </div>
  );
}

export function Loader({ text = "Loading…" }) {
  return <div className="empty-state">{text}</div>;
}

export function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <div className="error-text">{children}</div>;
}
