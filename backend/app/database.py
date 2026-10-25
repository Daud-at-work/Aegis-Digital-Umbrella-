"""MongoDB client and database handle."""

import os
from motor.motor_asyncio import AsyncIOMotorClient

from . import config as _config  # Load backend/.env before reading database settings.

mongo_url = os.environ["MONGODB_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
