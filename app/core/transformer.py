import pandas as pd
from .mappers import *
from .logger import setup_logger

logger = setup_logger()

mapper_funcs = {
    "getBitwiseEnum": get_bitwise_enum,
    "getValue": get_value,
    "calcVoltage": calc_voltage,
    "calcSpin": calc_spin,
    "getEnum": get_enum,
    "getEnumOrDefault": get_enum_or_default,
    "calcChildLock": calc_child_lock,
    "getAsMin": get_as_min,
    "calcHighLow": calc_high_low,
    "calcHeatTime": calc_heat_time,
}


def process_log(log_arr, config):
    """
    Transforms raw log data into structured key-value pairs using a configuration.
    Args:
        log_arr (list[int]): Raw log array from the device (e.g., [8, 12, 5]).
        config (dict): Configuration defining how to interpret logArr (from JSON).
    Returns:
        dict: Processed data with keys defined in the config (e.g., {"SEND_REASON": "SERVICE_CALL"}).
    Notes:
        Skips keys if indexes exceed logArr bounds.
    """
    result = {}
    for key, meta in config.items():
        info = meta["modelInfo"]
        indexes = info["index"]
        if any(i >= len(log_arr) for i in indexes):  # Yeni eklenen kontrol
            logger.warning(f"Invalid index for {key}. Skipping...")
            continue
        mapper = meta["mapperFunc"]
        values = [log_arr[i] for i in indexes]
        func = mapper_funcs.get(mapper)
        if func:
            result[key] = func(values if len(values) > 1 else values[0], info.get("bitSetEnumValues", info.get("enumValues", {})))
    return result
