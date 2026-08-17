import { pool } from '../db.js'

export async function claimReceipt(bookingId: string, kind: string) {
  try {
    const result = await pool.query(
      `INSERT INTO notification_receipts (booking_id, kind)
       VALUES ($1, $2)
       ON CONFLICT (booking_id, kind) DO NOTHING
       RETURNING kind`,
      [bookingId, kind],
    )
    return result.rows.length > 0
  } catch {
    return false
  }
}

export async function releaseReceipt(bookingId: string, kind: string) {
  await pool.query(
    `DELETE FROM notification_receipts WHERE booking_id = $1 AND kind = $2`,
    [bookingId, kind],
  )
}
