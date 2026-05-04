import { useState } from "react";

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

      <section className="panel" style={{ maxWidth: "600px", padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "12px", fontWeight: "bold", fontSize: "14px", color: "#40505a" }}>
            Source Log File (.txt)
          </label>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                background: "#f5f7f8", 
                color: "#172026", 
                border: "1px solid #cfd8dd",
                minHeight: "38px",
                whiteSpace: "nowrap"
              }}
            >
              Browse Files...
            </button>
            <span style={{ fontSize: "13px", color: "#64717b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file ? file.name : "No file selected"}
            </span>
          </div>
        </div>

        <button 
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ 
            width: "100%", 
            background: loading ? "#aebbc2" : "#2f6f73", 
            color: "white",
            fontWeight: "bold",
            marginTop: "10px"
          }}
        >
          {loading ? "Processing..." : "Start Ingestion"}
        </button>

        {error && (
          <div className="state error" style={{ marginTop: "16px", padding: "12px", background: "#fde7df", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {result && (
          <div className="state" style={{ marginTop: "16px", padding: "12px", background: "#ddf7e7", borderRadius: "8px", color: "#166534" }}>
            <strong>Success!</strong> {result.records_saved} records saved.
          </div>
        )}
      </section>
    </div>
  );
}
