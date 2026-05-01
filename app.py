import os
from app import create_app

app = create_app()

# AWS Lambda için WSGI adaptörü
try:
    import serverless_wsgi
    def handler(event, context):
        return serverless_wsgi.handle_request(app, event, context)
except ImportError:
    pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
