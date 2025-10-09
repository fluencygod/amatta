"""
Simple DB initializer to create all tables on the configured database.
Usage:
    python scripts/init_db.py
"""

from app.db import Base, engine


def main():
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


if __name__ == "__main__":
    main()

