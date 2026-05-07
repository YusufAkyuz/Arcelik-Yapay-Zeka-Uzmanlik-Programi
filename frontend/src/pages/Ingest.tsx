import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== "");
      
      const s3Client = new S3Client({
        region: import.meta.env.VITE_AWS_REGION || "eu-north-1",
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
        }
      });
      
      const bucket = import.meta.env.VITE_S3_BUCKET_NAME || "local-bucket";
      
      let successCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const timestamp = Math.floor(Date.now() / 1000);
        const objectName = `logs/raw_log_${timestamp}_${i + 1}.txt`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: objectName,
          Body: line
        }));
        
        successCount++;
      }
      
      setResult({ records_saved: successCount, message: "Satırlar başarıyla S3'e yüklendi!" });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload file to S3.");
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
            <CheckCircle size={20} /> <strong>Success!</strong> {result.records_saved} satır S3'e başarıyla yüklendi.
          </div>
        )}
      </section>
    </div>
  );
}
