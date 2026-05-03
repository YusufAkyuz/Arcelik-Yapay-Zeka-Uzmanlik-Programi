import os
from app import create_app
from app.extensions import db
from app.models import log_record  # modeli kayıt et

app = create_app()

# AWS Lambda için WSGI adaptörü
try:
    import serverless_wsgi

    def handler(event, context):
        # Tabloları ilk çalışmada oluştur (init'te değil, invoke'ta)
        with app.app_context():
            db.create_all()
        return serverless_wsgi.handle_request(app, event, context)
except ImportError:
    pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

