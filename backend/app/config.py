"""Environment loading, shared paths, and logging configuration."""

import logging
import os
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# --- FIXED CONFIG PATH ---
# Uses the current file's directory instead of a hardcoded path
ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / ".emergent"

def load_emergent_config():
    """Load configuration from .emergent YAML file"""
    try:
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH, 'r') as f:
                return yaml.safe_load(f) or {}
        return {}
    except Exception as e:
        logging.warning(f"Config load error: {str(e)}")
        return {}

load_dotenv(ROOT_DIR / '.env')
