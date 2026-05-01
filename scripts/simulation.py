import time
import boto3
import os
import argparse
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

# Proje kök dizinindeki .env dosyasını yükle
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

def upload_to_s3(file_name, bucket, object_name=None):
    """Upload a file to an S3 bucket"""
    if object_name is None:
        object_name = os.path.basename(file_name)

    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_DEFAULT_REGION', 'eu-north-1')
    )

    try:
        s3_client.upload_file(file_name, bucket, object_name)
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Başarıyla yüklendi: {object_name} -> s3://{bucket}/{object_name}")
    except NoCredentialsError:
        print("AWS yetki bilgileri bulunamadı. Lütfen .env dosyasını kontrol edin.")
    except Exception as e:
        print(f"Yükleme hatası: {e}")

def main():
    parser = argparse.ArgumentParser(description="AWS S3 Upload Simulation for Mercek Logs")
    # .env'den varsayılan değerleri oku, komut satırından override edilebilir
    parser.add_argument('--file', type=str, default=os.environ.get('SIMULATION_FILE', 'data/1.txt'), help='Path to raw data file')
    parser.add_argument('--bucket', type=str, default=os.environ.get('S3_BUCKET_NAME', 'local-bucket'), help='AWS S3 Bucket Name')
    parser.add_argument('--interval', type=int, default=int(os.environ.get('SIMULATION_INTERVAL', 60)), help='Upload interval in seconds')
    parser.add_argument('--endpoint', type=str, default='', help='Custom S3 Endpoint (e.g. http://localhost:4566 for LocalStack)')
    
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Hata: Dosya bulunamadı - {args.file}")
        return

    print(f"Simülasyon Başlıyor...\nDosya: {args.file}\nBucket: {args.bucket}\nAralık: {args.interval} saniye")
    
    counter = 1
    while True:
        # Gerçek dünyayı simüle etmek için dosyayı farklı isimlerle yüklüyoruz
        timestamp = int(time.time())
        object_name = f"logs/raw_log_{timestamp}_{counter}.txt"
        
        upload_to_s3(args.file, args.bucket, object_name)
        
        counter += 1
        print(f"Bekleniyor: {args.interval} saniye...\n")
        time.sleep(args.interval)

if __name__ == "__main__":
    main()
