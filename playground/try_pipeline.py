import logging
import sys
import time
from pathlib import Path

import nest_asyncio

# Configure real-time logging output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("try_pipeline")

sys.path.append(str(Path(__file__).resolve().parents[1]))

nest_asyncio.apply()
from app.ai.decide import decide

question = "Panel 4 of my HP-S3 is cracked. Order 112-4839201-5528341"

logger.info("Sending question to AI customer support pipeline...")
logger.info("Customer message: %r", question)

start_time = time.perf_counter()
decision = decide(question)
elapsed = time.perf_counter() - start_time

logger.info("Decision finished in %.2fs!", elapsed)
print("\n=== AI Decision Output ===")
print(decision.model_dump_json(indent=2))
