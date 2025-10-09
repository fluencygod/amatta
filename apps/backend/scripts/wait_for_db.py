import os
import sys
import time
from sqlalchemy import create_engine, text


def main():
    url = os.getenv("DATABASE_URL") or "mysql+pymysql://user:password@db:3306/newsdb"
    timeout = int(os.getenv("WAIT_FOR_DB_TIMEOUT", "60"))
    interval = float(os.getenv("WAIT_FOR_DB_INTERVAL", "2"))

    start = time.time()
    last_err = None
    while time.time() - start < timeout:
        try:
            engine = create_engine(url, pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("[wait_for_db] DB is reachable")
            return 0
        except Exception as e:
            last_err = e
            print(f"[wait_for_db] waiting for DB... {e}")
            time.sleep(interval)
    print(f"[wait_for_db] timeout after {timeout}s: {last_err}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
