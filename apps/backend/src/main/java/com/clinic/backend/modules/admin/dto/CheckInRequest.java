package com.clinic.backend.modules.admin.dto;

/**
 * Request body for checking in a web-booked patient.
 */
public class CheckInRequest {
    private String bookingId;
    private String phone;

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
