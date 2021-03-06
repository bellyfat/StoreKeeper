"""StoreKeeper v0.1.0

Revision ID: 90481802d
Revises: None
Create Date: 2015-11-16 09:03:04.143904

"""

revision = '90481802d'
down_revision = None

from alembic import op
import sqlalchemy as sa

from app.models import User


def add_default_admin_user():
    user = User(username="admin", email="admin@localhost", admin=True)
    user.set_password("admin")

    user_fields = ('username', 'password_hash', 'email', 'admin')
    user_dict = dict((field, getattr(user, field)) for field in user_fields)

    op.bulk_insert(User.__table__, [user_dict])


def upgrade():
    op.create_table('acquisition',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('customer',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=60), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('unit',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('unit', sa.String(length=20), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('unit')
    )
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=30), nullable=False),
    sa.Column('password_hash', sa.String(length=80), nullable=False),
    sa.Column('email', sa.String(length=50), nullable=False),
    sa.Column('admin', sa.Boolean(), nullable=False),
    sa.Column('disabled', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_username'), ['username'], unique=True)

    op.create_table('vendor',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=60), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=60), nullable=False),
    sa.Column('vendor_id', sa.Integer(), nullable=False),
    sa.Column('article_number', sa.String(length=20), nullable=True),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('warning_quantity', sa.Float(), nullable=False),
    sa.Column('unit_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['unit_id'], ['unit.id'], ),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendor.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('stocktaking',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('close_timestamp', sa.DateTime(), nullable=True),
    sa.Column('close_user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['close_user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('user_config',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=40), nullable=False),
    sa.Column('value', sa.String(length=200), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('user_config', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_config_name'), ['name'], unique=False)
        batch_op.create_index('user_config__can_not_add_one_name_twice_to_a_user', ['user_id', 'name'], unique=True)

    op.create_table('work',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('customer_id', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('outbound_close_timestamp', sa.DateTime(), nullable=True),
    sa.Column('outbound_close_user_id', sa.Integer(), nullable=True),
    sa.Column('returned_close_timestamp', sa.DateTime(), nullable=True),
    sa.Column('returned_close_user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['customer_id'], ['customer.id'], ),
    sa.ForeignKeyConstraint(['outbound_close_user_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['returned_close_user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('acquisition_item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('acquisition_id', sa.Integer(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['acquisition_id'], ['acquisition.id'], ),
    sa.ForeignKeyConstraint(['item_id'], ['item.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('acquisition_item', schema=None) as batch_op:
        batch_op.create_index('acquisition_item__can_not_add_one_item_twice', ['acquisition_id', 'item_id'], unique=True)

    op.create_table('barcode',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('barcode', sa.String(length=15), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('master', sa.Boolean(), nullable=True),
    sa.Column('main', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['item.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('barcode', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_barcode_barcode'), ['barcode'], unique=True)

    op.create_table('stocktaking_item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('stocktaking_id', sa.Integer(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['item_id'], ['item.id'], ),
    sa.ForeignKeyConstraint(['stocktaking_id'], ['stocktaking.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('stocktaking_item', schema=None) as batch_op:
        batch_op.create_index('stocktaking_item__can_not_add_one_item_twice', ['stocktaking_id', 'item_id'], unique=True)

    op.create_table('work_item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('work_id', sa.Integer(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('outbound_quantity', sa.Float(), nullable=False),
    sa.Column('returned_quantity', sa.Float(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['item.id'], ),
    sa.ForeignKeyConstraint(['work_id'], ['work.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('work_item', schema=None) as batch_op:
        batch_op.create_index('work_item__can_not_add_one_item_twice', ['work_id', 'item_id'], unique=True)

    # Add default admin user
    add_default_admin_user()


def downgrade():
    with op.batch_alter_table('work_item', schema=None) as batch_op:
        batch_op.drop_index('work_item__can_not_add_one_item_twice')

    op.drop_table('work_item')
    with op.batch_alter_table('stocktaking_item', schema=None) as batch_op:
        batch_op.drop_index('stocktaking_item__can_not_add_one_item_twice')

    op.drop_table('stocktaking_item')
    with op.batch_alter_table('barcode', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_barcode_barcode'))

    op.drop_table('barcode')
    with op.batch_alter_table('acquisition_item', schema=None) as batch_op:
        batch_op.drop_index('acquisition_item__can_not_add_one_item_twice')

    op.drop_table('acquisition_item')
    op.drop_table('work')
    with op.batch_alter_table('user_config', schema=None) as batch_op:
        batch_op.drop_index('user_config__can_not_add_one_name_twice_to_a_user')
        batch_op.drop_index(batch_op.f('ix_user_config_name'))

    op.drop_table('user_config')
    op.drop_table('stocktaking')
    op.drop_table('item')
    op.drop_table('vendor')
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_username'))

    op.drop_table('user')
    op.drop_table('unit')
    op.drop_table('customer')
    op.drop_table('acquisition')
