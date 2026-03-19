export type WalkInRequest = {
  patientName: string;
  patientPhone: string;
  shiftId: string;
};

export type ReceptionBooking = {
  id: string;
  queueNumber?: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | string;
  channel: 'WEB' | 'WALKIN' | string;
  serviceName?: string;
  status: string;
};

export type ShiftOverview = {
  id: string;
  doctorName: string;
  type: 'MORNING' | 'AFTERNOON' | string;
  bookedSlots: number;
  totalSlots: number;
  commonAvailable: number;
  reserveAvailable: number;
  status: 'OPEN' | 'CLOSED' | string;
};
