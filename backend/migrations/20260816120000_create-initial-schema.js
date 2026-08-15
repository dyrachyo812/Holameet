export function up(pgm) {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: { type: 'text', notNull: true, unique: true },
    username: { type: 'text', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    name: { type: 'text', notNull: true },
    timezone: { type: 'text', notNull: true, default: 'Europe/Kyiv' },
    working_hours_json: { type: 'jsonb' },
    buffer_minutes: { type: 'integer', notNull: true, default: 0 },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  })

  pgm.addConstraint(
    'users',
    'users_username_format_check',
    "CHECK (username ~ '^[a-z0-9]+(-[a-z0-9]+)*$')",
  )
  pgm.addConstraint(
    'users',
    'users_buffer_minutes_check',
    'CHECK (buffer_minutes >= 0)',
  )

  pgm.createTable('event_types', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    title: { type: 'text', notNull: true },
    slug: { type: 'text', notNull: true },
    duration_minutes: { type: 'integer', notNull: true },
    is_active: { type: 'boolean', notNull: true, default: true },
  })

  pgm.addConstraint(
    'event_types',
    'event_types_user_id_slug_unique',
    'UNIQUE (user_id, slug)',
  )
  pgm.addConstraint(
    'event_types',
    'event_types_duration_minutes_check',
    'CHECK (duration_minutes > 0)',
  )

  pgm.createTable('bookings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_type_id: {
      type: 'uuid',
      notNull: true,
      references: 'event_types',
      onDelete: 'RESTRICT',
    },
    invitee_name: { type: 'text', notNull: true },
    invitee_email: { type: 'text', notNull: true },
    invitee_tz: { type: 'text', notNull: true },
    start_time_utc: { type: 'timestamptz', notNull: true },
    end_time_utc: { type: 'timestamptz', notNull: true },
    calendar_event_id: { type: 'text' },
    status: { type: 'text', notNull: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  })

  pgm.addConstraint(
    'bookings',
    'bookings_status_check',
    "CHECK (status IN ('confirmed', 'cancelled'))",
  )
  pgm.addConstraint(
    'bookings',
    'bookings_time_range_check',
    'CHECK (end_time_utc > start_time_utc)',
  )
  pgm.createIndex('bookings', ['event_type_id', 'start_time_utc'], {
    name: 'bookings_confirmed_slot_unique',
    unique: true,
    where: "status = 'confirmed'",
  })

  pgm.createTable('calendar_connections', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    provider: { type: 'text', notNull: true },
    access_token_encrypted: { type: 'text', notNull: true },
    refresh_token_encrypted: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    is_valid: { type: 'boolean', notNull: true, default: true },
  })

  pgm.addConstraint(
    'calendar_connections',
    'calendar_connections_user_id_provider_unique',
    'UNIQUE (user_id, provider)',
  )
}

export function down(pgm) {
  pgm.dropTable('calendar_connections')
  pgm.dropTable('bookings')
  pgm.dropTable('event_types')
  pgm.dropTable('users')
}
