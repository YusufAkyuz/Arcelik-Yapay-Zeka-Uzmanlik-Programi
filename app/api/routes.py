from flask import Blueprint, request, jsonify

api_bp = Blueprint('api', __name__)

@api_bp.route('/process-s3-file', methods=['POST'])
def process_s3_file():
    # S3 Event'leri veya manuel tetiklemeler için uç nokta
    data = request.json
    
    # İleride burada app/core/transformer.py çağrılacak.
    return jsonify({"message": "S3 file processing triggered", "data": data}), 200

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    return jsonify({"message": "This will return processed logs from RDS in the future."}), 200
