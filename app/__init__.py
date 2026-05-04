from flask import Flask
from app.extensions import db
import os

def create_app():
    app = Flask(__name__)

    # Veritabanı bağlantısı ayarı (Çevre değişkeninden alır, yoksa yerel SQLite kullanır)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///mercek.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # SQLAlchemy eklentisini bağla
    db.init_app(app)

    # React uygulaması ayrı origin'den çalışacağı için API cevaplarına CORS header'ı eklenir.
    from flask_cors import CORS
    CORS(app, resources={r"/api/*": {"origins": os.environ.get("CORS_ORIGINS", "*")}})

    # NOT: db.create_all() buradan kaldırıldı.
    # Lambda init aşamasında ağ bağlantısı olmadığı için timeout'a sebep oluyordu.
    # Tablolar artık handler ilk çalıştığında oluşturulacak.

    # Blueprint'leri kaydedelim
    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/health')
    def health_check():
        from sqlalchemy import text
        from app.extensions import get_redis_client

        database_status = "ok"
        redis_status = "ok"

        try:
            db.session.execute(text("SELECT 1"))
        except Exception:
            database_status = "error"

        if get_redis_client() is None:
            redis_status = "unavailable"

        status = "ok" if database_status == "ok" else "degraded"
        return {
            "status": status,
            "database": database_status,
            "redis": redis_status,
            "message": "Mercek Analytics API is running."
        }

    return app
