import json
import os

# İlk olarak varolan config.json dosyasını kontrol edip python objesi haline çevirme işlemi gerçekleştirilecek.
def load_config(config_path):
    """
    Loads a JSON configuration file into a Python dictionary.
    Args:
        config_path (str): Path to the JSON configuration file.
    Returns:
        dict: Parsed configuration data, or None if the file is invalid/missing.
    Raises:
        JSONDecodeError: If the file contains invalid JSON.
    """
    if os.path.exists(config_path):
        with open(config_path, 'r') as file:
            try:
                config = json.load(file)
                return config
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {e}")
                return None
    else:
        print("File path not found:", config_path)
        return None
