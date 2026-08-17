export function up(pgm) {
  pgm.addColumns('bookings', {
    invitee_telegram_chat_id: { type: 'bigint' },
  })

  pgm.createTable('telegram_connections', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    telegram_user_id: { type: 'bigint', notNull: true, unique: true },
    chat_id: { type: 'bigint', notNull: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  })

  pgm.createTable('telegram_link_tokens', {
    token: { type: 'text', primaryKey: true },
    user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'CASCADE',
    },
    booking_id: {
      type: 'uuid',
      references: 'bookings',
      onDelete: 'CASCADE',
    },
    expires_at: { type: 'timestamptz', notNull: true },
  })
  pgm.addConstraint(
    'telegram_link_tokens',
    'telegram_link_tokens_target_check',
    'CHECK ((user_id IS NULL) <> (booking_id IS NULL))',
  )

  pgm.createTable('notification_receipts', {
    booking_id: {
      type: 'uuid',
      notNull: true,
      references: 'bookings',
      onDelete: 'CASCADE',
    },
    kind: { type: 'text', notNull: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  })
  pgm.addConstraint(
    'notification_receipts',
    'notification_receipts_booking_kind_unique',
    'UNIQUE (booking_id, kind)',
  )
}

export function down(pgm) {
  pgm.dropTable('notification_receipts')
  pgm.dropTable('telegram_link_tokens')
  pgm.dropTable('telegram_connections')
  pgm.dropColumns('bookings', ['invitee_telegram_chat_id'])
}
