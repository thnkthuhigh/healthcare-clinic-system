export type BookingChannel = 'WEB' | 'WALK_IN';

export type BookingStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'PENDING_LAB'
  | 'RESULTS_READY'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'VOID';
