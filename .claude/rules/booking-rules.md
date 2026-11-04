# Booking Rules & Concurrency

## Booking Statuses
```
HOLD       — seats reserved, pending confirmation (15 min TTL)
CONFIRMED  — booking finalised
CANCELLED  — user cancelled
EXPIRED    — hold TTL passed without confirmation
```

## DB-Level Concurrency Guard
`BookingSeat` has `@@unique([screeningId, seatId])` — prevents duplicate seat claims at the database level.
