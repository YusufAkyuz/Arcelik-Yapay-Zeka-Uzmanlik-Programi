from app.core.transformer import process_log

SAMPLE_CONFIG = {
    "SEND_REASON": {
        "modelInfo": {
            "index": [0],
            "type": "byte",
            "bitSetEnumValues": {"3": "SERVICE_CALL"}
        },
        "mapperFunc": "getBitwiseEnum"
    },
    "VOLTAGE": {
        "modelInfo": {"index": [1], "type": "int"},
        "mapperFunc": "calcVoltage"
    }
}

def test_process_log_valid():
    log_arr = [8, 15]
    result = process_log(log_arr, SAMPLE_CONFIG)
    assert result == {
        "SEND_REASON": ["SERVICE_CALL"],
        "VOLTAGE": 150
    }

def test_process_log_invalid_index():
    log_arr = [8]  # VOLTAGE requires index 1, which is missing
    result = process_log(log_arr, SAMPLE_CONFIG)
    assert "VOLTAGE" not in result  # Ensure invalid index is skipped
