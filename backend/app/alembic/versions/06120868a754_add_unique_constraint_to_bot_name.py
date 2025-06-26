"""add_unique_constraint_to_bot_name

Revision ID: 06120868a754
Revises: 2b76dc7aba83
Create Date: 2025-06-27 00:55:18.027808

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '06120868a754'
down_revision = '2b76dc7aba83'
branch_labels = None
depends_on = None


def upgrade():
    # Add unique constraint to wechat_bots.name
    op.create_unique_constraint(
        'uq_wechat_bots_name',
        'wechat_bots',
        ['name']
    )


def downgrade():
    # Remove unique constraint from wechat_bots.name
    op.drop_constraint(
        'uq_wechat_bots_name',
        'wechat_bots',
        type_='unique'
    )
