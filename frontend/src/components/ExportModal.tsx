import { useState, useEffect } from "react";
import { exportToFormat } from "../api";

interface Props {
  format: "mkdocs" | "docusaurus";
  project: string;
  onClose: () => void;
}

const LABELS: Record<string, string> = {
  mkdocs: "MkDocs (mkdocs.yml nav)",
  docusaurus: "Docusaurus (sidebars.js)",
};

export default function ExportModal({ format, project, onClose }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    exportToFormat(project, format)
      .then(setContent)
      .catch((e) => setError(e.message ?? "Export failed"))
      .finally(() => setLoading(false));
  }, [project, format]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        style={{ width: "600px", maxHeight: "80vh", background: "#fff", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, flex: 1 }}>Export to {LABELS[format]}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#888", padding: "0 4px" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", flex: 1, overflow: "auto" }}>
          {loading && <div style={{ color: "#888", padding: "20px", textAlign: "center" }}>Generating...</div>}
          {error && <div style={{ color: "#d32f2f", fontSize: "13px" }}>{error}</div>}
          {!loading && !error && (
            <pre style={{
              fontFamily: "monospace", fontSize: "13px", padding: "12px",
              background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "4px",
              whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
              maxHeight: "400px", overflow: "auto",
            }}>{content}</pre>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #e0e0e0", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "6px 16px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff", cursor: "pointer" }}>Close</button>
          {!loading && !error && (
            <button onClick={handleCopy} style={{ padding: "6px 16px", fontSize: "13px", border: "none", borderRadius: "4px", background: "#1a6fa8", color: "#fff", cursor: "pointer" }}>
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
