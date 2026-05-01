import logging

def setup_logger(name="MercekLogger", level=logging.INFO):
    """
    Configures and returns a logger with streaming handler.
    Args:
        name (str): Name of the logger (default: "MercekLogger").
        level (int): Logging level (e.g., logging.INFO, logging.ERROR).
    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name)
    if not logger.hasHandlers():
        logger.setLevel(level)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
