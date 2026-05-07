from flask import Blueprint, request, jsonify
from app.services.log_service import LogService
from app.models.log_record import ApplianceLog
from app.extensions import db
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
import boto3
import os
import time

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
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        appliance_id = request.args.get('appliance_id')
        conn_state = request.args.get('conn_state')
        
        query = ApplianceLog.query
        
        if appliance_id:
            query = query.filter_by(appliance_id=appliance_id)
        if conn_state:
            query = query.filter_by(conn_state=conn_state)
            
        total = query.count()
        logs = query.order_by(ApplianceLog.timestamp.desc()).offset(offset).limit(limit).all()
        
        return jsonify({
            "items": [log.to_dict() for log in logs],
            "total": total,
            "limit": limit,
            "offset": offset
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    try:
        total_logs = ApplianceLog.query.count()
        total_appliances = db.session.query(func.count(func.distinct(ApplianceLog.appliance_id))).scalar() or 0
        
        online_count = ApplianceLog.query.filter_by(conn_state='online').count()
        offline_count = ApplianceLog.query.filter_by(conn_state='offline').count()
        
        latest_log = ApplianceLog.query.order_by(ApplianceLog.timestamp.desc()).first()
        latest_log_timestamp = latest_log.timestamp.isoformat() if latest_log and latest_log.timestamp else None
        
        # Logs by day (last 14 days relative to the latest log to ensure graph is never empty for old data)
        if latest_log and latest_log.timestamp:
            fourteen_days_ago = latest_log.timestamp - timedelta(days=14)
            logs_by_day_query = db.session.query(
                cast(ApplianceLog.timestamp, Date).label('date'),
                func.count().label('count')
            ).filter(ApplianceLog.timestamp >= fourteen_days_ago)\
             .group_by('date').order_by('date').all()
             
            logs_by_day = [{"date": str(row.date), "count": row.count} for row in logs_by_day_query]
        else:
            logs_by_day = []
        
        return jsonify({
            "total_logs": total_logs,
            "total_appliances": total_appliances,
            "online_count": online_count,
            "offline_count": offline_count,
            "latest_log_timestamp": latest_log_timestamp,
            "logs_by_day": logs_by_day
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/appliances', methods=['GET'])
def get_appliances():
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        total = db.session.query(func.count(func.distinct(ApplianceLog.appliance_id))).scalar() or 0
        
        appliances = db.session.query(
            ApplianceLog.appliance_id,
            func.count().label('log_count'),
            func.max(ApplianceLog.timestamp).label('last_seen'),
            func.max(ApplianceLog.latitude).label('latitude'),
            func.max(ApplianceLog.longitude).label('longitude')
        ).group_by(ApplianceLog.appliance_id)\
         .order_by(func.max(ApplianceLog.timestamp).desc())\
         .offset(offset).limit(limit).all()
        
        items = [{
            "appliance_id": a.appliance_id,
            "log_count": a.log_count,
            "last_seen": a.last_seen.isoformat() if a.last_seen else None,
            "latitude": a.latitude,
            "longitude": a.longitude
        } for a in appliances]
        
        return jsonify({
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/appliances/<appliance_id>', methods=['GET'])
def get_appliance_detail(appliance_id):
    try:
        log_count = ApplianceLog.query.filter_by(appliance_id=appliance_id).count()
        if log_count == 0:
            return jsonify({"error": "Device not found"}), 404
            
        latest_log = ApplianceLog.query.filter_by(appliance_id=appliance_id)\
                        .order_by(ApplianceLog.timestamp.desc()).first()
                        
        return jsonify({
            "appliance_id": appliance_id,
            "log_count": log_count,
            "latest_log": latest_log.to_dict() if latest_log else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/appliances/<appliance_id>/logs', methods=['GET'])
def get_appliance_logs(appliance_id):
    try:
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        query = ApplianceLog.query.filter_by(appliance_id=appliance_id)
        total = query.count()
        logs = query.order_by(ApplianceLog.timestamp.desc()).offset(offset).limit(limit).all()
        
        return jsonify({
            "items": [log.to_dict() for log in logs],
            "total": total,
            "limit": limit,
            "offset": offset
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/ingest', methods=['POST'])
def ingest_logs():
    try:
        data = request.get_json()
        if not data or 'lines' not in data:
            return jsonify({"error": "No lines provided"}), 400
        
        lines = data['lines']
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            region_name=os.environ.get('AWS_DEFAULT_REGION', 'eu-north-1')
        )
        bucket = os.environ.get('S3_BUCKET_NAME', 'local-bucket')
        
        success_count = 0
        for i, line in enumerate(lines):
            timestamp = int(time.time())
            object_name = f"logs/raw_log_{timestamp}_{i + 1}.txt"
            
            s3_client.put_object(Bucket=bucket, Key=object_name, Body=line.encode('utf-8'))
            success_count += 1
            
        return jsonify({"records_saved": success_count, "message": "Successfully uploaded to S3"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
