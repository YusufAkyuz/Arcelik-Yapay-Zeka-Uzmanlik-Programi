from flask_sqlalchemy import SQLAlchemy
import redis
import os

db = SQLAlchemy()

def get_redis_client():
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    try:
        client = redis.from_url(redis_url)
        # Test connection
        client.ping()
        return client
    except Exception as e:
        print(f"Redis bağlantı hatası: {e}")
        return None

redis_client = get_redis_client()
