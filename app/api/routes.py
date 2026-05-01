from flask import Blueprint, request, jsonify
from app.services.log_service import LogService
from app.models.log_record import ApplianceLog

api_bp = Blueprint('api', __name__)

@api_bp.route('/process-s3-file', methods=['POST'])
def process_s3_file():
    try:
        payload = request.json or {}
        
        # S3 Notification Event formatı
        if 'Records' in payload:
            import boto3
            s3_client = boto3.client('s3')
            total_saved = 0
            for record in payload['Records']:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                response = s3_client.get_object(Bucket=bucket, Key=key)
                file_content = response['Body'].read().decode('utf-8')
                
                saved = LogService.process_and_save_logs(file_content)
                total_saved += saved
            
            return jsonify({"message": "S3 events processed", "records_saved": total_saved}), 200

        # Lokal testler için doğrudan dosya içeriği
        elif 'file_content' in payload:
            saved = LogService.process_and_save_logs(payload['file_content'])
            return jsonify({"message": "Logs processed", "records_saved": saved}), 200

        return jsonify({"error": "Invalid payload format. Expected 'Records' or 'file_content'."}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    try:
        limit = request.args.get('limit', 10, type=int)
        logs = ApplianceLog.query.order_by(ApplianceLog.timestamp.desc()).limit(limit).all()
        return jsonify([log.to_dict() for log in logs]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
