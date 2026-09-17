import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import api from "../../api/client";
import { Loader, ErrorText } from "../../components/UI";

export default function TakeQuiz() {
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const attemptId = location.state?.attemptId;

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!attemptId) return;
    async function init() {
      const docRes = await api.get(`/documents/${documentId}`);
      const versionId = docRes.data.document.currentVersion._id;
      const quizRes = await api.get(`/quizzes/version/${versionId}`);
      setQuiz(quizRes.data.quiz);
    }
    init();
  }, [documentId, attemptId]);

  if (!attemptId) {
    return (
      <div className="card" style={{ maxWidth: 480 }}>
        <h2>Start reading first</h2>
        <p className="helper-text">Please open the document and finish reading before taking the assessment.</p>
        <Link to={`/my/documents/${documentId}/read`} className="btn" style={{ marginTop: 10 }}>
          Go to document
        </Link>
      </div>
    );
  }

  if (!quiz) return <Loader />;

  function selectAnswer(questionId, index) {
    setAnswers((a) => ({ ...a, [questionId]: index }));
  }

  async function handleSubmit() {
    setError("");
    if (Object.keys(answers).length < quiz.questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }));
      const res = await api.post("/assessment/quiz/submit", { attemptId, answers: payload });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h1 style={{ color: result.passed ? "var(--success)" : "var(--danger)" }}>{result.passed ? "Congratulations!" : "Not quite there"}</h1>
          <p style={{ fontSize: 32, fontWeight: 700, margin: "10px 0" }}>{result.score}%</p>
          <p className="helper-text">
            {result.correctCount} correct · {result.incorrectCount} incorrect · out of {result.totalQuestions} question(s) (pass mark{" "}
            {result.passPercentage}%)
          </p>
          {result.passed ? <p>Your certificate has been generated and added to your profile.</p> : <p>You can retake the assessment after reviewing the document again.</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <Link to="/my/documents" className="btn secondary">
              Back to my documents
            </Link>
            {result.passed && (
              <Link to="/my/certificates" className="btn">
                View certificates
              </Link>
            )}
            {!result.passed && (
              <Link to={`/my/documents/${documentId}/read`} className="btn">
                Retake
              </Link>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2>Answer review</h2>
          {result.breakdown.map((b, idx) => (
            <div key={idx} style={{ padding: "12px 0", borderBottom: idx < result.breakdown.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <p style={{ fontWeight: 600, margin: 0 }}>
                  {idx + 1}. {b.questionText}
                </p>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: b.isCorrect ? "var(--success)" : "var(--danger)" }}>
                  {b.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="helper-text" style={{ margin: "4px 0 0 0" }}>
                Your answer: {b.selectedIndex !== null ? b.options[b.selectedIndex] : "(no answer)"}
              </p>
              {!b.isCorrect && (
                <p className="helper-text" style={{ margin: "2px 0 0 0", color: "var(--success)" }}>
                  Correct answer: {b.options[b.correctOptionIndex]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h1>Assessment</h1>
      <p className="helper-text">Pass mark: {quiz.passPercentage}%. Answer all questions and submit.</p>

      {quiz.questions.map((q, idx) => (
        <div className="card" key={q._id} style={{ marginTop: 14 }}>
          <h3>
            Question {idx + 1}. {q.questionText}
          </h3>
          {q.options.map((opt, oIdx) => (
            <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer" }}>
              <input type="radio" name={q._id} checked={answers[q._id] === oIdx} onChange={() => selectAnswer(q._id, oIdx)} />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <ErrorText>{error}</ErrorText>
      <button className="btn" style={{ marginTop: 16 }} onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit assessment"}
      </button>
    </div>
  );
}
