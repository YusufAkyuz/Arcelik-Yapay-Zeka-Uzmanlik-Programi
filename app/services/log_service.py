import json
import re
from datetime import datetime, timezone
from app.extensions import db, redis_client
from app.models.log_record import ApplianceLog
from app.core.config_loader import load_config
from app.core.transformer import process_log
from app.core.logger import setup_logger

logger = setup_logger()

CONFIG_REDIS_KEY = "mercek_config_v1_10"
DEFAULT_CONFIG_PATH = "config/v1_10.json"

class LogService:
    @staticmethod
    def get_config():
        """
        Config dosyasını önce Redis'ten okumayı dener, yoksa diskten okur ve Redis'e yazar.
        """
        if redis_client:
            try:
                cached_config = redis_client.get(CONFIG_REDIS_KEY)
                if cached_config:
                    return json.loads(cached_config)
            except Exception as e:
                logger.warning(f"Redis okuma hatası: {e}")

        # Redis'te yoksa diskten al
        config = load_config(DEFAULT_CONFIG_PATH)
        
        if config and redis_client:
            try:
                # 24 saat önbellekte tut
                redis_client.setex(CONFIG_REDIS_KEY, 86400, json.dumps(config))
            except Exception as e:
                logger.warning(f"Redis yazma hatası: {e}")
                
        return config

    @staticmethod
    def extract_log_data(raw_segments):
        try:
            combined = ";".join(raw_segments)
            cleaned = combined.replace('""', '"').replace('"{', '{').replace('}"', '}')

            size_match = re.search(r'"logArrSize"\s*:\s*{\s*"N"\s*:\s*"(\d+)"\s*}', cleaned)
            log_arr_size = int(size_match.group(1)) if size_match else 0

            conn_match = re.search(r'connState:\s*{\s*"S"\s*:\s*"(\w+)"\s*}', cleaned)
            conn_state = conn_match.group(1) if conn_match else "unknown"

            log_arr_matches = re.findall(r'"N"\s*:\s*"(\d+)"', cleaned)[1:]
            log_arr = [int(n) for n in log_arr_matches[:log_arr_size]]

            return log_arr, conn_state
        except Exception as e:
            logger.error(f"Log parsing error: {e}")
            return [], "error"

    @staticmethod
    def process_and_save_logs(file_content: str):
        """
        S3'ten veya direkt POST ile gelen dosya içeriğini okur, işler ve DB'ye yazar.
        """
        config = LogService.get_config()
        if not config:
            raise ValueError("Konfigürasyon dosyası yüklenemedi.")

        lines = file_content.strip().split('\n')
        saved_count = 0

        for line in lines:
            if not line.strip():
                continue
                
            parts = line.strip().split(";")
            if len(parts) < 5:
                continue

            appliance_id = parts[0]
            lat = float(parts[1])
            lon = float(parts[2])
            
            try:
                ts = int(parts[3]) // 1000
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            except Exception as e:
                logger.warning(f"Invalid timestamp detected: {parts[3]}")
                continue

            log_arr, conn_state = LogService.extract_log_data(parts[4:])
            if not log_arr:
                continue

            parsed_data = process_log(log_arr, config)

            # DB'ye kaydet
            new_log = ApplianceLog(
                appliance_id=appliance_id,
                latitude=lat,
                longitude=lon,
                timestamp=dt,
                conn_state=conn_state,
                parsed_data=parsed_data
            )
            db.session.add(new_log)
            saved_count += 1

        db.session.commit()
        logger.info(f"{saved_count} kayıt başarıyla veritabanına işlendi.")
        return saved_count
