"""add salary range to job order

Revision ID: 1f7c6b2d9a10
Revises: 070b2aedc583
Create Date: 2026-05-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1f7c6b2d9a10"
down_revision: Union[str, Sequence[str], None] = "070b2aedc583"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "job_order",
        sa.Column("salary_min", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.add_column(
        "job_order",
        sa.Column("salary_max", sa.Numeric(precision=12, scale=2), nullable=True),
    )
    op.execute("UPDATE job_order SET salary_min = salary WHERE salary IS NOT NULL")


def downgrade() -> None:
    op.drop_column("job_order", "salary_max")
    op.drop_column("job_order", "salary_min")
