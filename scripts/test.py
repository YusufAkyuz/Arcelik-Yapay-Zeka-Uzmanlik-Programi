import pandas as pd
import re
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config_loader import load_config
from app.core.transformer import process_log
import argparse
from app.core.logger import setup_logger
from datetime import datetime, timezone


logger = setup_logger()

def extract_log_data(raw_segments):
    """
    Extracts logArr and connState from raw text segments.
    Args:
        raw_segments (list[str]): Split parts of a raw log line (e.g., ["F999963781...", "36.6244", ...]).
    Returns:
        tuple: (log_arr, conn_state) where:
            - log_arr (list[int]): Valid logArr values up to logArrSize.
            - conn_state (str): "online", "offline".
    Raises:
        ValueError: If logArrSize or logArr parsing fails.
    """
    try:
        # txt verisini okumak için parçalar birleştirilip, işaret düzenlemeleri yapılıyor.
        combined = ";".join(raw_segments)
        cleaned = combined.replace('""', '"').replace('"{', '{').replace('}"', '}')

        # logArrSize değeri
        size_match = re.search(r'"logArrSize"\s*:\s*{\s*"N"\s*:\s*"(\d+)"\s*}', cleaned)
        log_arr_size = int(size_match.group(1)) if size_match else 0

        # connState değeri
        conn_match = re.search(r'connState:\s*{\s*"S"\s*:\s*"(\w+)"\s*}', cleaned)
        conn_state = conn_match.group(1) if conn_match else "unknown"

        # logArr değerleri
        log_arr_matches = re.findall(r'"N"\s*:\s*"(\d+)"', cleaned)[1:]
        log_arr = [int(n) for n in log_arr_matches[:log_arr_size]]

        return log_arr, conn_state
    except Exception as e:
        print("Log parsing error:", e)
        logger.error(f"Log parsing error: {e}")
        return [], "error"

def main():
    parser = argparse.ArgumentParser(description="IoT Mercek Data Interpreter")
    parser.add_argument('--config', type=str, default='config/v1_10.json', help='Path to configuration file')
    parser.add_argument('--input', type=str, default='data/1.txt', help='Path to input data file')
    parser.add_argument('--output', type=str, default='output/processed_data.csv', help='Path to output CSV file')
    parser.add_argument('--json-output', type=str, help='(Optional) Path to output JSON file')

    args = parser.parse_args()

    config = load_config(args.config)

    if config is None:
        print("The configuration file was not found.")
        logger.error("The configuration file was not found.")
        return

    all_results = []

    with open(args.input, "r", encoding="utf-8") as f:
        for line in f:
            try:
                parts = line.strip().split(";")
                if len(parts) < 5:
                    continue

                # ilk 4 parça appliance_id, lat, lon ve timestamp
                appliance_id = parts[0]
                lat = float(parts[1])
                lon = float(parts[2])
                try:
                    ts = int(parts[3]) // 1000  # milisaniyeyi saniyeye çevir yoksa timestamp hatası alırız.
                    ts_utc = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                except Exception as e:
                    print(f"Timestamp conversion error: {parts[3]} is not a valid timestamp.")
                    logger.warning(f"Invalid timestamp detected: {parts[3]}")
    
                # Geri kalan parçalar log verisi bunları düzenlemek ve işlemek için extract_log_data fonksiyonu çağrılıyor.
                log_arr, conn_state = extract_log_data(parts[4:])

                result = process_log(log_arr, config)
                result.update({
                    "ApplianceId": appliance_id,
                    "Latitude": lat,
                    "Longitude": lon,
                    "Timestamp": ts_utc,
                    "ConnState": conn_state
                })
                all_results.append(result)
            except Exception as e:
                print(f"The row could not be processed: {e}")
                logger.warning(f"Row skipped due to error: {e}")
                continue

    # Olusan çıktıları csv de kaydetme
    df = pd.DataFrame(all_results)
    df.to_csv(args.output, index=False, encoding="utf-8-sig")
    print(f"{len(all_results)} record was successfully processed and saved to file '{args.output}'.")
    logger.info(f"{len(all_results)} records written to: {args.output}")

    # Olusan çıktıları json olarak kaydetme
    if args.json_output:
        df.to_json(args.json_output, orient="records", force_ascii=False, indent=2)
        print(f"JSON output written to: {args.json_output}")
        logger.info(f"JSON output written to: {args.json_output}")

if __name__ == "__main__":
    main()
