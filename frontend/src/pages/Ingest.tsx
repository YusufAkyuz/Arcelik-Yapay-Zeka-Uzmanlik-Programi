import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";

export function Ingest() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      try {
        const text = await selectedFile.text();
        const lines = text.split('\n').filter(line => line.trim() !== "").slice(0, 5);
        setPreview(lines.join('\n'));
      } catch (err) {
        setPreview("Could not preview file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== "");
      
      const response = await fetch("http://localhost:5001/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload to backend.");
      }

      const data = await response.json();
      setResult({ records_saved: data.records_saved, message: "Satırlar başarıyla S3'e yüklendi!" });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload file to S3.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: "32px", borderBottom: "1px solid var(--table-border)", paddingBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "12px", color: "var(--text-primary)" }}>Data Ingestion Simulator</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
            Upload a telemetry log file to simulate an appliance data stream. 
            The selected file will be parsed, and each log entry will be sent step-by-step to your 
            AWS S3 bucket. This triggers the serverless Lambda function pipeline for real-time processing.
          </p>
        </div>
      </header>

      <section className="panel" style={{ padding: "32px" }}>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "16px", fontWeight: "600", fontSize: "15px", color: "var(--text-primary)" }}>
            Source Log File (.txt)
          </label>
          
          <div 
            style={{ 
              border: "2px dashed var(--table-border)", 
              borderRadius: "12px", 
              padding: "32px", 
              textAlign: "center",
              background: "rgba(248, 250, 252, 0.5)",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ marginBottom: "16px", color: "var(--primary-accent)", display: "flex", justifyContent: "center" }}>
              <FileText size={48} strokeWidth={1.5} opacity={0.8} />
            </div>
            <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "14px" }}>
              {file ? <strong>{file.name}</strong> : "Select a telemetry log file to upload"}
            </p>
            <input 
              id="hidden-file-input"
              type="file" 
              accept=".txt" 
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button 
              onClick={() => document.getElementById('hidden-file-input')?.click()}
              style={{ 
                background: "white", 
                color: "var(--text-primary)", 
                border: "1px solid var(--table-border)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Browse Files...
            </button>
          </div>

          {preview && (
            <div style={{ marginTop: "24px", textAlign: "left" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", display: "inline-block" }}>
                Data Preview (First 5 records):
              </span>
              <pre style={{ 
                background: "#0f172a", 
                color: "#e2e8f0", 
                padding: "16px", 
                borderRadius: "8px", 
                fontSize: "12px", 
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
                border: "1px solid #1e293b",
                fontFamily: "monospace"
              }}>
                {preview}
              </pre>
            </div>
          )}
        </div>

        <button 
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ 
            width: "100%", 
            marginTop: "16px",
            fontSize: "15px",
            fontWeight: 600,
            padding: "14px",
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            background: (loading || !file) ? "rgba(241, 245, 249, 0.5)" : "var(--primary-accent)",
            color: (loading || !file) ? "var(--text-secondary)" : "white",
            border: (loading || !file) ? "1px solid var(--table-border)" : "1px solid var(--primary-accent)",
            borderRadius: "8px",
            cursor: (loading || !file) ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: (loading || !file) ? "none" : "0 4px 6px rgba(79, 70, 229, 0.2)"
          }}
        >
          <UploadCloud size={20} />
          {loading ? "Simulating Upload to AWS S3..." : "Start Simulation"}
        </button>

        {error && (
          <div className="state error" style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {result && (
          <div className="state" style={{ marginTop: "24px", color: "var(--success-text)", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <CheckCircle size={20} /> <strong>Success!</strong> {result.records_saved} satır S3'e başarıyla yüklendi.
          </div>
        )}
      </section>
    </div>
  );
}
