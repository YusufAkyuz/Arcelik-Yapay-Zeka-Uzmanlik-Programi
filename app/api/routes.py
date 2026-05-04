from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app.services.log_service import LogService
from app.models.log_record import ApplianceLog

api_bp = Blueprint('api', __name__)

def _parse_datetime(value):
    if not value:
        return None
    try:
        # React tarih inputları ve ISO timestamp'ler aynı endpointte desteklenir.
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

def _apply_log_filters(query):
    appliance_id = request.args.get('appliance_id')
    conn_state = request.args.get('conn_state')
    start = _parse_datetime(request.args.get('start'))
    end = _parse_datetime(request.args.get('end'))

    if appliance_id:
        query = query.filter(ApplianceLog.appliance_id == appliance_id)
    if conn_state:
        query = query.filter(ApplianceLog.conn_state == conn_state)
    if start:
        query = query.filter(ApplianceLog.timestamp >= start)
    if end:
        query = query.filter(ApplianceLog.timestamp <= end)
    return query

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
        limit = min(request.args.get('limit', 50, type=int), 200)
        offset = request.args.get('offset', 0, type=int)

        query = _apply_log_filters(ApplianceLog.query)
        total = query.count()
        logs = (
            query.order_by(ApplianceLog.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return jsonify({
            "items": [log.to_dict() for log in logs],
            "total": total,
            "limit": limit,
            "offset": offset
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/logs/<int:log_id>', methods=['GET'])
def get_log_detail(log_id):
    try:
        log = ApplianceLog.query.get(log_id)
        if not log:
            return jsonify({"error": "Log not found"}), 404
        return jsonify(log.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    try:
        # Tek endpoint frontend dashboard kartlarının ilk yüklemesini hızlı yapar.
        total_logs = ApplianceLog.query.count()
        total_appliances = db_count_distinct_appliances()
        online_count = ApplianceLog.query.filter(ApplianceLog.conn_state == "online").count()
        offline_count = ApplianceLog.query.filter(ApplianceLog.conn_state == "offline").count()
        latest_log = ApplianceLog.query.order_by(ApplianceLog.timestamp.desc()).first()

        by_day = (
            ApplianceLog.query
            .with_entities(func.date(ApplianceLog.timestamp).label("day"), func.count(ApplianceLog.id))
            .group_by(func.date(ApplianceLog.timestamp))
            .order_by(func.date(ApplianceLog.timestamp).desc())
            .limit(14)
            .all()
        )

        return jsonify({
            "total_logs": total_logs,
            "total_appliances": total_appliances,
            "online_count": online_count,
            "offline_count": offline_count,
            "latest_log_timestamp": latest_log.timestamp.isoformat() if latest_log else None,
            "logs_by_day": [
                {"date": str(day), "count": count}
                for day, count in reversed(by_day)
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/appliances', methods=['GET'])
def get_appliances():
    try:
        limit = min(request.args.get('limit', 100, type=int), 500)
        offset = request.args.get('offset', 0, type=int)

        rows = (
            ApplianceLog.query
            .with_entities(
                ApplianceLog.appliance_id,
                func.count(ApplianceLog.id).label("log_count"),
                func.max(ApplianceLog.timestamp).label("last_seen"),
                func.avg(ApplianceLog.latitude).label("latitude"),
                func.avg(ApplianceLog.longitude).label("longitude")
            )
            .group_by(ApplianceLog.appliance_id)
            .order_by(func.max(ApplianceLog.timestamp).desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return jsonify({
            "items": [
                {
                    "appliance_id": appliance_id,
                    "log_count": log_count,
                    "last_seen": last_seen.isoformat() if last_seen else None,
                    "latitude": latitude,
                    "longitude": longitude
                }
                for appliance_id, log_count, last_seen, latitude, longitude in rows
            ],
            "limit": limit,
            "offset": offset,
            "total": db_count_distinct_appliances()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/appliances/<appliance_id>', methods=['GET'])
def get_appliance_detail(appliance_id):
    try:
        latest_log = (
            ApplianceLog.query
            .filter(ApplianceLog.appliance_id == appliance_id)
            .order_by(ApplianceLog.timestamp.desc())
            .first()
        )
        if not latest_log:
            return jsonify({"error": "Appliance not found"}), 404

        log_count = ApplianceLog.query.filter(ApplianceLog.appliance_id == appliance_id).count()

        return jsonify({
            "appliance_id": appliance_id,
            "log_count": log_count,
            "latest_log": latest_log.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/appliances/<appliance_id>/logs', methods=['GET'])
def get_appliance_logs(appliance_id):
    try:
        limit = min(request.args.get('limit', 50, type=int), 200)
        offset = request.args.get('offset', 0, type=int)
        query = _apply_log_filters(
            ApplianceLog.query.filter(ApplianceLog.appliance_id == appliance_id)
        )
        total = query.count()
        logs = (
            query.order_by(ApplianceLog.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return jsonify({
            "items": [log.to_dict() for log in logs],
            "total": total,
            "limit": limit,
            "offset": offset
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def db_count_distinct_appliances():
    return ApplianceLog.query.with_entities(
        func.count(func.distinct(ApplianceLog.appliance_id))
    ).scalar() or 0
