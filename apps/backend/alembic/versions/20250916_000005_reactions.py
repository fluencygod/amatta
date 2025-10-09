"""add reactions table

Revision ID: 20250916_000005
Revises: 20250916_000004
Create Date: 2025-09-16 00:00:05
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20250916_000005"
down_revision = "20250916_000004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "article_id", name="uq_reactions_user_article"),
    )
    op.create_index("ix_reactions_user_id", "reactions", ["user_id"]) 
    op.create_index("ix_reactions_article_id", "reactions", ["article_id"]) 


def downgrade() -> None:
    op.drop_index("ix_reactions_article_id", table_name="reactions")
    op.drop_index("ix_reactions_user_id", table_name="reactions")
    op.drop_table("reactions")

