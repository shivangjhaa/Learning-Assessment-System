import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { ErrorText, Loader } from "../../components/UI";

function emptyQuestion() {
  return { questionText: "", options: ["", ""], correctOptionIndex: 0 };
}

export default function QuizBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [targetVersion, setTargetVersion] = useState(null);
  const [passPercentage, setPassPercentage] = useState(80);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/documents/${id}`).then(async (res) => {
      setDocument(res.data.document);
      const version = res.data.pendingVersion || res.data.document.currentVersion;
      setTargetVersion(version);
      if (version) {
        try {
          const qres = await api.get(`/quizzes/version/${version._id}`);
          if (qres.data.quiz.questions.length) {
            setPassPercentage(qres.data.quiz.passPercentage);
            setQuestions(
              qres.data.quiz.questions.map((q) => ({
                questionText: q.questionText,
                options: q.options,
                correctOptionIndex: q.correctOptionIndex,
              }))
            );
          }
        } catch {
          /* no quiz yet */
        }
      }
    });
  }, [id]);

  function updateQuestion(idx, field, value) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function updateOption(qIdx, oIdx, value) {
    setQuestions((qs) => qs.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q)));
  }

  function addOption(qIdx) {
    setQuestions((qs) => qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q)));
  }

  function removeOption(qIdx, oIdx) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.filter((_, j) => j !== oIdx);
        const correctOptionIndex = q.correctOptionIndex >= options.length ? 0 : q.correctOptionIndex;
        return { ...q, options, correctOptionIndex };
      })
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setError("");
    if (!targetVersion) {
      setError("This document has no version to attach a quiz to yet.");
      return;
    }
    for (const q of questions) {
      if (!q.questionText.trim() || q.options.some((o) => !o.trim())) {
        setError("Every question needs text and all options filled in.");
        return;
      }
    }
    setSaving(true);
    try {
      await api.put(`/quizzes/version/${targetVersion._id}`, { passPercentage, questions });
      navigate(`/documents/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  }

  if (!document) return <Loader />;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Assessment quiz — {document.title}</h1>
      <p className="helper-text">
        {targetVersion
          ? `This quiz applies to version ${targetVersion.versionNumber}. Employees must pass it after reading to earn a certificate.`
          : "This document has no uploaded version yet."}
      </p>

      <div className="card" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Pass percentage</label>
          <input className="input" type="number" min={1} max={100} value={passPercentage} onChange={(e) => setPassPercentage(Number(e.target.value))} />
        </div>
      </div>

      {questions.map((q, qIdx) => (
        <div className="card" key={qIdx} style={{ marginBottom: 14 }}>
          <div className="section-header">
            <h3>Question {qIdx + 1}</h3>
            {questions.length > 1 && (
              <button type="button" className="btn danger small" onClick={() => removeQuestion(qIdx)}>
                Remove
              </button>
            )}
          </div>
          <div className="field">
            <label>Question text</label>
            <input className="input" value={q.questionText} onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)} />
          </div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>Options (select the correct one)</label>
          {q.options.map((opt, oIdx) => (
            <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <input
                type="radio"
                name={`correct-${qIdx}`}
                checked={q.correctOptionIndex === oIdx}
                onChange={() => updateQuestion(qIdx, "correctOptionIndex", oIdx)}
              />
              <input className="input" value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} />
              {q.options.length > 2 && (
                <button type="button" className="btn secondary small" onClick={() => removeOption(qIdx, oIdx)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn secondary small" style={{ marginTop: 10 }} onClick={() => addOption(qIdx)}>
            + Add option
          </button>
        </div>
      ))}

      <button type="button" className="btn secondary" onClick={addQuestion}>
        + Add question
      </button>

      <ErrorText>{error}</ErrorText>

      <div style={{ marginTop: 18 }}>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save quiz"}
        </button>
      </div>
    </div>
  );
}
