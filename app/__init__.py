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

    # NOT: db.create_all() buradan kaldırıldı.
    # Lambda init aşamasında ağ bağlantısı olmadığı için timeout'a sebep oluyordu.
    # Tablolar artık handler ilk çalıştığında oluşturulacak.

    # Blueprint'leri kaydedelim
    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/health')
    def health_check():
        return {"status": "ok", "message": "Mercek Analytics API is running."}

    return app
