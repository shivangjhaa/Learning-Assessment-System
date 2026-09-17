import { useEffect, useState } from "react";
import api, { fileUrl } from "../api/client";

export function fileKind(fileType = "", fileName = "") {
  const type = fileType || "";
  const name = (fileName || "").toLowerCase();
  if (type.startsWith("video")) return "video";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("wordprocessingml") || name.endsWith(".docx")) return "docx";
  if (type === "application/msword" || name.endsWith(".doc")) return "legacy-doc";
  if (type.startsWith("image")) return "image";
  return "other";
}

/**
 * Renders a document inline regardless of format:
 * - video: native <video> player
 * - pdf: embedded viewer via <iframe>
 * - docx (Word, .docx only): converted to HTML server-side (mammoth) and rendered as text
 * - legacy .doc, images, and anything else: falls back to an "open" link, since browsers can't
 *   render those formats inline (and old binary .doc isn't something mammoth can parse)
 */
export default function FileViewer({ documentId, versionId, path, fileType, fileName, height = "70vh" }) {
  const kind = fileKind(fileType, fileName);
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (kind !== "docx" || !documentId || !versionId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get(`/documents/${documentId}/versions/${versionId}/docx-html`)
      .then((res) => {
        if (!cancelled) setHtml(res.data.html);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Couldn't render this Word document inline.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, versionId, kind]);

  if (kind === "video") {
    return <video src={fileUrl(path)} controls style={{ width: "100%", display: "block" }} />;
  }

  if (kind === "pdf") {
    return <iframe title="document-viewer" src={fileUrl(path)} style={{ width: "100%", height, border: "none" }} />;
  }

  if (kind === "image") {
    return <img src={fileUrl(path)} alt="document" style={{ width: "100%", display: "block" }} />;
  }

  if (kind === "docx") {
    if (loading) {
      return (
        <div style={{ padding: 24 }} className="helper-text">
          Rendering document…
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ padding: 24 }}>
          <p className="helper-text">{error}</p>
          <a href={fileUrl(path)} target="_blank" rel="noreferrer" className="btn secondary">
            Open document in new tab
          </a>
        </div>
      );
    }
    return (
      <div className="docx-preview" style={{ maxHeight: height, overflowY: "auto" }} dangerouslySetInnerHTML={{ __html: html || "" }} />
    );
  }

  const message =
    kind === "legacy-doc"
      ? "Legacy .doc files can't be previewed inline — please open it directly, or ask for it to be re-saved as .docx."
      : "This file type can't be previewed inline — please open it directly.";

  return (
    <div style={{ padding: 24 }}>
      <p className="helper-text">{message}</p>
      <a href={fileUrl(path)} target="_blank" rel="noreferrer" className="btn secondary">
        Open document in new tab
      </a>
    </div>
  );
}
