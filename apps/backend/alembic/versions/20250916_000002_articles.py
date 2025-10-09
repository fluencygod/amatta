"""add articles table

Revision ID: 20250916_000002
Revises: 20240915_000001
Create Date: 2025-09-16 00:00:02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "20250916_000002"
down_revision = "20240915_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("articles"):
        op.create_table(
            "articles",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("site", sa.String(length=80), nullable=False),
            sa.Column("url", sa.String(length=1024), nullable=False, unique=True),
            sa.Column("title", sa.String(length=512), nullable=False),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("content", sa.Text(), nullable=True),
            sa.Column("author", sa.String(length=255), nullable=True),
            sa.Column("category", sa.String(length=255), nullable=True),
            sa.Column("image_url", sa.String(length=1024), nullable=True),
            sa.Column("published_at", sa.DateTime(), nullable=True),
            sa.Column("fetched_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_articles_site", "articles", ["site"]) 
        op.create_index("ix_articles_fetched", "articles", ["fetched_at"]) 
        op.create_index("ix_articles_site_fetched_bk", "articles", ["site", "fetched_at"]) 
    else:
        # if table exists (created by crawler), ensure minimal indexes exist
        # create index only if missing
        existing = {ix["name"] for ix in inspector.get_indexes("articles")}
        if "ix_articles_site" not in existing:
            op.create_index("ix_articles_site", "articles", ["site"]) 
        if "ix_articles_fetched" not in existing:
            op.create_index("ix_articles_fetched", "articles", ["fetched_at"]) 
        if "ix_articles_site_fetched_bk" not in existing:
            op.create_index("ix_articles_site_fetched_bk", "articles", ["site", "fetched_at"]) 


def downgrade() -> None:
    op.drop_index("ix_articles_site_fetched_bk", table_name="articles")
    op.drop_index("ix_articles_fetched", table_name="articles")
    op.drop_index("ix_articles_site", table_name="articles")
    op.drop_table("articles")
