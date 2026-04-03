import { useState, useEffect } from "react";
import { importFromFormat } from "../api";

interface Props {
  format: "mkdocs" | "docusaurus";
  project: string;
  onClose: () => void;
  onImported: () => void;
}

const PLACEHOLDERS: Record<string, string> = {
  mkdocs: `nav:
  - Home: index.md
  - Getting Started:
    - Installation: install.md
    - Configuration: config.md
  - API Reference: api.md`,
  docusaurus: `module.exports = {
  docs: [
    { type: 'doc', id: 'intro', label: 'Introduction' },
    {
      type: 'category',
      label: 'Guides',
      items: [
        { type: 'doc', id: 'guides/install', label: 'Install' }
      ]
    }
  ]
};`,
};

const LABELS: Record<string, string> = {
  mkdocs: "MkDocs (mkdocs.yml nav)",
  docusaurus: "Docusaurus (sidebars.js)",
};

export default function ImportModal({ format, project, onClose, onImported }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ warnings: string[]; node_count: number } | null>(null);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleImport = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await importFromFormat(project, format, content);
      setResult(res);
      if (res.warnings.length === 0) {
        onImported();
        onClose();
      }
    } catch (e: any) {
      setError(e.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onImported();
    onClose();
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
          <span style={{ fontSize: "15px", fontWeight: 600, flex: 1 }}>Import from {LABELS[format]}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#888", padding: "0 4px" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", flex: 1, overflow: "auto" }}>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(""); setResult(null); }}
            placeholder={PLACEHOLDERS[format]}
            style={{
              width: "100%", height: "250px", fontFamily: "monospace", fontSize: "13px",
              padding: "10px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {error && <div style={{ color: "#d32f2f", fontSize: "13px", marginTop: "8px" }}>{error}</div>}
          {result && result.warnings.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e65100", marginBottom: "4px" }}>
                Imported {result.node_count} nodes with {result.warnings.length} warning(s):
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#888" }}>
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #e0e0e0", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "6px 16px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff", cursor: "pointer" }}>Cancel</button>
          {result && result.warnings.length > 0 ? (
            <button onClick={handleConfirm} style={{ padding: "6px 16px", fontSize: "13px", border: "none", borderRadius: "4px", background: "#e65100", color: "#fff", cursor: "pointer" }}>Accept with warnings</button>
          ) : (
            <button onClick={handleImport} disabled={loading || !content.trim()} style={{ padding: "6px 16px", fontSize: "13px", border: "none", borderRadius: "4px", background: content.trim() ? "#1a6fa8" : "#ccc", color: "#fff", cursor: content.trim() ? "pointer" : "default" }}>
              {loading ? "Importing..." : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
