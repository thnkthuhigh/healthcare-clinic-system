package com.clinic.backend.modules.doctor.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;
    
    @Column(name = "slot_id", nullable = false)
    private UUID slotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", insertable = false, updatable = false)
    private Slot slot;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingChannel channel;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "paid_by_user_id")
    private UUID paidByUserId;

    @Column(name = "booking_fee_cents", nullable = false)
    private Integer bookingFeeCents = 1_000_000;

    @Column(name = "booking_fee_paid_at")
    private Instant bookingFeePaidAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_fee_payment_method")
    private PaymentMethod bookingFeePaymentMethod;

    @Column(name = "is_follow_up", nullable = false)
    private Boolean isFollowUp = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follow_up_source_booking_id")
    private Booking followUpSourceBooking;

    @Column(name = "follow_up_scheduled_at")
    private Instant followUpScheduledAt;

    @Column(name = "follow_up_note")
    private String followUpNote;

    @Column(name = "lab_fee_cents", nullable = false)
    private Integer labFeeCents = 0;

    @Column(name = "lab_requested_at")
    private Instant labRequestedAt;

    @Column(name = "lab_fee_note")
    private String labFeeNote;
    
    @Column(name = "queue_number")
    private Integer queueNumber;
    
    @Column(name = "priority_score", nullable = false)
    private Integer priorityScore = 0;
    
    @Column(name = "check_in_at")
    private Instant checkInAt;
    
    @Column(name = "started_at")
    private Instant startedAt;
    
    @Column(name = "completed_at")
    private Instant completedAt;
    
    @Column(name = "skip_count", nullable = false)
    private Integer skipCount = 0;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    
    public enum BookingChannel {
        WEB, WALK_IN
    }
    
    public enum BookingStatus {
        BOOKED,
        CHECKED_IN,
        WAITING,
        IN_CONSULTATION,
        PENDING_LAB,
        RESULTS_READY,
        COMPLETED,
        NO_SHOW,
        CANCELED
    }
    
    public enum PaymentStatus {
        UNPAID, PAID, VOID
    }

    public enum PaymentMethod {
        QR, CASH
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public Shift getShift() { return shift; }
    public void setShift(Shift shift) { this.shift = shift; }
    
    public UUID getSlotId() { return slotId; }
    public void setSlotId(UUID slotId) { this.slotId = slotId; }

    public Slot getSlot() { return slot; }
    public void setSlot(Slot slot) { this.slot = slot; }
    
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    
    public Service getService() { return service; }
    public void setService(Service service) { this.service = service; }
    
    public BookingChannel getChannel() { return channel; }
    public void setChannel(BookingChannel channel) { this.channel = channel; }
    
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }

    public UUID getPaidByUserId() { return paidByUserId; }
    public void setPaidByUserId(UUID paidByUserId) { this.paidByUserId = paidByUserId; }

    public Integer getBookingFeeCents() { return bookingFeeCents; }
    public void setBookingFeeCents(Integer bookingFeeCents) { this.bookingFeeCents = bookingFeeCents; }

    public Instant getBookingFeePaidAt() { return bookingFeePaidAt; }
    public void setBookingFeePaidAt(Instant bookingFeePaidAt) { this.bookingFeePaidAt = bookingFeePaidAt; }

    public PaymentMethod getBookingFeePaymentMethod() { return bookingFeePaymentMethod; }
    public void setBookingFeePaymentMethod(PaymentMethod bookingFeePaymentMethod) { this.bookingFeePaymentMethod = bookingFeePaymentMethod; }

    public Boolean getIsFollowUp() { return isFollowUp; }
    public void setIsFollowUp(Boolean isFollowUp) { this.isFollowUp = isFollowUp; }

    public Booking getFollowUpSourceBooking() { return followUpSourceBooking; }
    public void setFollowUpSourceBooking(Booking followUpSourceBooking) { this.followUpSourceBooking = followUpSourceBooking; }

    public Instant getFollowUpScheduledAt() { return followUpScheduledAt; }
    public void setFollowUpScheduledAt(Instant followUpScheduledAt) { this.followUpScheduledAt = followUpScheduledAt; }

    public String getFollowUpNote() { return followUpNote; }
    public void setFollowUpNote(String followUpNote) { this.followUpNote = followUpNote; }

    public Integer getLabFeeCents() { return labFeeCents; }
    public void setLabFeeCents(Integer labFeeCents) { this.labFeeCents = labFeeCents; }

    public Instant getLabRequestedAt() { return labRequestedAt; }
    public void setLabRequestedAt(Instant labRequestedAt) { this.labRequestedAt = labRequestedAt; }

    public String getLabFeeNote() { return labFeeNote; }
    public void setLabFeeNote(String labFeeNote) { this.labFeeNote = labFeeNote; }
    
    public Integer getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Integer queueNumber) { this.queueNumber = queueNumber; }
    
    public Integer getPriorityScore() { return priorityScore; }
    public void setPriorityScore(Integer priorityScore) { this.priorityScore = priorityScore; }
    
    public Instant getCheckInAt() { return checkInAt; }
    public void setCheckInAt(Instant checkInAt) { this.checkInAt = checkInAt; }
    
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    
    public Integer getSkipCount() { return skipCount; }
    public void setSkipCount(Integer skipCount) { this.skipCount = skipCount; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
