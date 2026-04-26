"""initial migration

Revision ID: 0001_initial
Revises: 
Create Date: 2026-03-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated ###
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('username', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
    )

    op.create_table(
        'devices',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('os', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('host', sa.String(), nullable=True),
        sa.Column('ssh_username', sa.String(), nullable=True),
        sa.Column('ssh_port', sa.Integer(), nullable=True),
        sa.Column('ssh_key', sa.String(), nullable=True),
        sa.Column('ssh_password', sa.String(), nullable=True),
    )

    op.create_table(
        'script_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False, index=True),
        sa.Column('command', sa.String(), nullable=True),
        sa.Column('result', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated ###
    op.drop_table('script_jobs')
    op.drop_table('devices')
    op.drop_table('users')
    # ### end Alembic commands ###
