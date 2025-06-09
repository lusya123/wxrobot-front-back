"""Add wake_words to bot_configs

Revision ID: add_wake_words_field
Revises: ddfbf4361f5c
Create Date: 2025-01-10 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_wake_words_field'
down_revision = 'ddfbf4361f5c'
branch_labels = None
depends_on = None


def upgrade():
    # Add wake_words column to bot_configs table
    op.add_column('bot_configs', 
        sa.Column('wake_words', sa.Text(), nullable=True, 
                  comment='唤醒词，多个词用英文逗号分隔')
    )


def downgrade():
    # Remove wake_words column from bot_configs table
    op.drop_column('bot_configs', 'wake_words') 