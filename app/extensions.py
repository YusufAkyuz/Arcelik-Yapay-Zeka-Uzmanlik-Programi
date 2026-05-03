from flask_sqlalchemy import SQLAlchemy
import redis
import os

db = SQLAlchemy()

# Redis bağlantı durumunu tutmak için
_redis_client = None
_redis_failed = False

def get_redis_client():
    global _redis_client, _redis_failed
    
    if _redis_failed:
        return None
        
    if _redis_client is not None:
        return _redis_client

    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    try:
        client = redis.from_url(
            redis_url,
            socket_timeout=1,
            socket_connect_timeout=1
        )
        # Bağlantıyı test et
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception as e:
        print(f"Redis bağlantı hatası (devam ediliyor): {e}")
        _redis_failed = True
        return None
