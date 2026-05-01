from flask import Flask

def create_app():
    app = Flask(__name__)

    # Blueprint'leri kaydedelim
    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/health')
    def health_check():
        return {"status": "ok", "message": "Mercek Analytics API is running."}

    return app
