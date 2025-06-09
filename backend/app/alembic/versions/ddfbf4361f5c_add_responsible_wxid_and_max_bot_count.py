"""add_responsible_wxid_and_max_bot_count

Revision ID: ddfbf4361f5c
Revises: 85bea7b437b3
Create Date: 2025-06-08 23:53:53.627708

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ddfbf4361f5c'
down_revision = '85bea7b437b3'
branch_labels = None
depends_on = None


def upgrade():
    # 1. 添加 responsible_wxid 字段到 bot_configs 表
    op.add_column('bot_configs', sa.Column('responsible_wxid', sa.String(length=255), nullable=True))
    
    # 2. 添加 max_bot_count 字段到 users 表
    op.add_column('users', sa.Column('max_bot_count', sa.Integer(), nullable=False, server_default='1'))


def downgrade():
    # 移除添加的字段
    op.drop_column('users', 'max_bot_count')
    op.drop_column('bot_configs', 'responsible_wxid')
