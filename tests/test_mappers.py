import pytest
from app.core.mappers import get_bitwise_enum, get_enum, calc_voltage, get_as_min

def test_get_bitwise_enum():
    # Normal Case
    assert get_bitwise_enum(8, {"3": "SERVICE_CALL"}) == ["SERVICE_CALL"]
    
    # Multiple Bits Active
    assert sorted(get_bitwise_enum(9, {"0": "NORMAL", "3": "SERVICE_CALL"})) == ["NORMAL", "SERVICE_CALL"]
    
    # Invalid Enum Map
    assert get_bitwise_enum(8, {}) == []
    
    # Edge Case: Zero
    assert get_bitwise_enum(0, {"0": "NORMAL"}) == []

def test_get_enum():
    assert get_enum("2", {"2": "ERROR"}) == "ERROR"
    assert get_enum("5", {"2": "ERROR"}) == "Unknown"

def test_calc_voltage():
    assert calc_voltage("15", None) == 150
    with pytest.raises(ValueError):
        calc_voltage("invalid", None)  # String input should raise error

def test_get_as_min():
    assert get_as_min(["2", "30"], None) == 150  # 2*60 + 30 = 150
