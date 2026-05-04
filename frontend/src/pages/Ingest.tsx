import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";

export function Ingest() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const response = await fetch("http://localhost:5001/api/process-s3-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_content: text }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "An error occurred during processing.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Data Ingestion</h1>
          <p>Upload telemetry logs to the database.</p>
        </div>
      </header>

      <section className="panel" style={{ maxWidth: "600px", padding: "32px" }}>
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
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              Browse Files...
            </button>
          </div>
        </div>

        <button 
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ 
            width: "100%", 
            marginTop: "10px",
            fontSize: "15px",
            padding: "12px",
            display: "flex",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <UploadCloud size={20} />
          {loading ? "Processing..." : "Start Ingestion"}
        </button>

        {error && (
          <div className="state error" style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {result && (
          <div className="state" style={{ marginTop: "24px", color: "var(--success-text)", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <CheckCircle size={20} /> <strong>Success!</strong> {result.records_saved} records saved.
          </div>
        )}
      </section>
    </div>
  );
}
