import os
import boto3
from app import create_app
from app.extensions import db
from app.models import log_record  # modeli SQLAlchemy'ye kayıt et

# Flask uygulamasını modül düzeyinde oluştur (bağlantı kurmaz, sadece config)
app = create_app()
s3_client = boto3.client('s3')


def handler(event, context):
    """
    S3 olayı ile tetiklenen Lambda handler.
    S3'e yüklenen log dosyasını okur, işler ve RDS'e kaydeder.
    """
    with app.app_context():
        # Tabloları ilk çalışmada oluştur
        db.create_all()

        from app.services.log_service import LogService

        processed_files = 0
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            print(f"İşleniyor: s3://{bucket}/{key}")

            # S3'ten dosyayı indir
            response = s3_client.get_object(Bucket=bucket, Key=key)
            file_content = response['Body'].read().decode('utf-8')

            # İşle ve DB'ye yaz
            saved_count = LogService.process_and_save_logs(file_content)
            print(f"Tamamlandı: {key} -> {saved_count} kayıt veritabanına yazıldı.")
            processed_files += 1

    return {
        'statusCode': 200,
        'body': f'{processed_files} dosya başarıyla işlendi.'
    }

