"""merge_heads

Revision ID: 2b76dc7aba83
Revises: add_wake_words_field, ec573ee0004b
Create Date: 2025-06-27 00:55:02.308126

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '2b76dc7aba83'
down_revision = ('add_wake_words_field', 'ec573ee0004b')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
