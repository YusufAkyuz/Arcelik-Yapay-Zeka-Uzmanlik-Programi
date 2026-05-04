from app.extensions import db
from datetime import datetime

class ApplianceLog(db.Model):
    __tablename__ = 'appliance_logs'
    __table_args__ = (
        db.UniqueConstraint('appliance_id', 'timestamp', name='uq_appliance_log_event'),
    )

    id = db.Column(db.Integer, primary_key=True)
    appliance_id = db.Column(db.String(100), index=True, nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, index=True, nullable=False)
    conn_state = db.Column(db.String(50))
    parsed_data = db.Column(db.JSON, nullable=False)  # Tüm dinamik log verileri burada tutulacak
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "appliance_id": self.appliance_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "conn_state": self.conn_state,
            "parsed_data": self.parsed_data,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
