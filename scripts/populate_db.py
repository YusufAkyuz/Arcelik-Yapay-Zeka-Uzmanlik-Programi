import json
import urllib.request
import os

def upload_logs():
    data_dir = "data"
    url = "http://127.0.0.1:5001/api/process-s3-file"
    
    # data klasöründeki tüm .txt dosyalarını bul
    files = [f for f in os.listdir(data_dir) if f.endswith(".txt")]
    
    for filename in files:
        data_path = os.path.join(data_dir, filename)
        print(f"\n--- Processing {filename} ---")
        try:
            with open(data_path, encoding="utf-8") as f:
                file_content = f.read()
            
            payload = {"file_content": file_content}
            
            print(f"Sending data to {url}...")
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            
            with urllib.request.urlopen(req) as response:
                result = response.read().decode("utf-8")
                print(f"SUCCESS for {filename}!")
                print(result)
                
        except Exception as e:
            print(f"ERROR for {filename}: {str(e)}")

if __name__ == "__main__":
    upload_logs()
