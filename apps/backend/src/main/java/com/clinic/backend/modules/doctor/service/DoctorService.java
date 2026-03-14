package com.clinic.backend.modules.doctor.service;

import com.clinic.backend.modules.doctor.dto.*;
import com.clinic.backend.modules.doctor.entity.*;
import com.clinic.backend.modules.doctor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ShiftRepository shiftRepository;
    private final BookingRepository bookingRepository;
    private final PatientRepository patientRepository;

    public DoctorService(
            DoctorRepository doctorRepository,
            ShiftRepository shiftRepository,
            BookingRepository bookingRepository,
            PatientRepository patientRepository) {
        this.doctorRepository = doctorRepository;
        this.shiftRepository = shiftRepository;
        this.bookingRepository = bookingRepository;
        this.patientRepository = patientRepository;
    }

    /**
     * Get doctor by user ID
     */
    public DoctorDto getDoctorByUserId(UUID userId) {
        return doctorRepository.findByUserId(userId)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    /**
     * Get doctor's shifts for a specific date
     */
    public List<ShiftDto> getShiftsByDate(UUID doctorId, LocalDate date) {
        List<Shift> shifts = shiftRepository.findByDoctorIdAndDate(doctorId, date);
        return shifts.stream().map(this::toShiftDto).toList();
    }

    /**
     * Get shift details with statistics
     */
    public ShiftDto getShiftById(UUID shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        return toShiftDto(shift);
    }

    /**
     * Get patient queue for a shift (sorted by priority - Logic B)
     */
    public List<QueueItemDto> getQueueByShift(UUID shiftId, String statusFilter) {
        List<String> statuses;

        if (statusFilter == null || statusFilter.equalsIgnoreCase("ALL")) {
            statuses = Arrays.asList(
                    "BOOKED",
                    "CHECKED_IN",
                    "WAITING",
                    "IN_CONSULTATION",
                    "RESULTS_READY",
                    "COMPLETED");
        } else {
            statuses = List.of(statusFilter.toUpperCase());
        }

        List<Booking> bookings = bookingRepository.findQueueByShiftId(shiftId, statuses);
        return sortQueueForDisplay(bookings).stream().map(this::toQueueItemDto).toList();
    }

    /**
     * Get all bookings for a shift (unfiltered)
     */
    public List<QueueItemDto> getAllBookingsByShift(UUID shiftId) {
        List<Booking> bookings = bookingRepository.findAllByShiftId(shiftId);
        return bookings.stream().map(this::toQueueItemDto).toList();
    }

    /**
     * Get doctor's shifts across a date range (for schedule page)
     */
    public List<ShiftDto> getShiftsByDateRange(UUID doctorId, LocalDate from, LocalDate to) {
        List<Shift> shifts = shiftRepository.findByDoctorIdAndDateBetween(doctorId, from, to);
        return shifts.stream().map(this::toShiftDto).toList();
    }

    /**
     * Get doctor's detailed schedule across a date range with patient bookings.
     */
    public List<ScheduleShiftDto> getDetailedSchedule(UUID doctorId, LocalDate from, LocalDate to) {
        List<Shift> shifts = shiftRepository.findByDoctorIdAndDateBetween(doctorId, from, to);
        if (shifts.isEmpty()) {
            return List.of();
        }

        List<UUID> shiftIds = shifts.stream().map(Shift::getId).toList();
        Map<UUID, List<Booking>> bookingsByShift = new LinkedHashMap<>();

        for (Booking booking : bookingRepository.findScheduleByShiftIds(shiftIds)) {
            if (booking.getStatus() == Booking.BookingStatus.CANCELED) {
                continue;
            }
            bookingsByShift
                    .computeIfAbsent(booking.getShift().getId(), ignored -> new java.util.ArrayList<>())
                    .add(booking);
        }

        return shifts.stream()
                .map(shift -> toScheduleShiftDto(
                        shift,
                        bookingsByShift.getOrDefault(shift.getId(), Collections.emptyList())))
                .toList();
    }

    /**
     * Search patients by name, phone or national ID
     */
    public List<PatientDto> searchPatients(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return patientRepository.search(query)
                .stream()
                .map(this::toPatientDto)
                .toList();
    }

    // ========== Mappers ==========

    private DoctorDto toDto(Doctor doctor) {
        return new DoctorDto(
                doctor.getId(),
                doctor.getDisplayName(),
                doctor.getSpecialty(),
                doctor.getAvatarUrl(),
                doctor.getUser().getPhone());
    }

    private ShiftDto toShiftDto(Shift shift) {
        UUID shiftId = shift.getId();

        long total = bookingRepository.countByShiftId(shiftId);
        long waiting = bookingRepository.countByShiftIdAndStatus(shiftId, "WAITING") +
                bookingRepository.countByShiftIdAndStatus(shiftId, "RESULTS_READY");
        long checkedIn = bookingRepository.countByShiftIdAndStatus(shiftId, "CHECKED_IN");
        long inConsultation = bookingRepository.countByShiftIdAndStatus(shiftId, "IN_CONSULTATION");
        long completed = bookingRepository.countByShiftIdAndStatus(shiftId, "COMPLETED");

        return new ShiftDto(
                shift.getId(),
                shift.getDate(),
                shift.getType(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getTimeRange(),
                shift.getStatus(),
                total,
                waiting,
                checkedIn,
                inConsultation,
                completed);
    }

    private ScheduleShiftDto toScheduleShiftDto(Shift shift, List<Booking> bookings) {
        long booked = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.BOOKED)
                .count();
        long checkedIn = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.CHECKED_IN)
                .count();
        long waiting = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.WAITING
                        || booking.getStatus() == Booking.BookingStatus.RESULTS_READY)
                .count();
        long inConsultation = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.IN_CONSULTATION)
                .count();
        long completed = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.COMPLETED)
                .count();

        List<ScheduleBookingDto> bookingDtos = bookings.stream()
                .map(booking -> toScheduleBookingDto(shift, booking))
                .toList();

        return new ScheduleShiftDto(
                shift.getId(),
                shift.getDate(),
                shift.getType(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getTimeRange(),
                shift.getStatus(),
                bookings.size(),
                booked,
                waiting,
                checkedIn,
                inConsultation,
                completed,
                bookingDtos);
    }

    private ScheduleBookingDto toScheduleBookingDto(Shift shift, Booking booking) {
        Slot slot = booking.getSlot();
        int slotSequence = slot != null && slot.getSequence() != null ? slot.getSequence() : 1;
        Slot.SlotPool slotPool = slot != null ? slot.getPool() : null;

        return new ScheduleBookingDto(
                booking.getId(),
                booking.getQueueNumber(),
                calculateAppointmentTime(shift, slotSequence),
                slotSequence,
                slotPool,
                toPatientDto(booking.getPatient()),
                booking.getService() != null ? booking.getService().getName() : null,
                booking.getStatus(),
                booking.getChannel(),
                booking.getCheckInAt());
    }

    private QueueItemDto toQueueItemDto(Booking booking) {
        int slotSequence = getSlotSequence(booking);

        return new QueueItemDto(
                booking.getId(),
                booking.getQueueNumber(),
                calculateAppointmentTime(booking.getShift(), slotSequence),
                slotSequence,
                toPatientDto(booking.getPatient()),
                booking.getService() != null ? booking.getService().getName() : null,
                booking.getStatus(),
                booking.getChannel(),
                booking.getCheckInAt(),
                booking.getPriorityScore(),
                booking.getSkipCount());
    }

    private PatientDto toPatientDto(Patient patient) {
        return new PatientDto(
                patient.getId(),
                patient.getFullName(),
                patient.getPhone(),
                patient.getNationalId(),
                patient.getDateOfBirth(),
                patient.getAge(),
                patient.getGender(),
                patient.getWeightKg(),
                patient.getHeightCm(),
                patient.getAllergies(),
                patient.getAddress());
    }

    private java.time.Instant calculateAppointmentTime(Shift shift, int slotSequence) {
        long minutesOffset = Math.max(slotSequence - 1, 0) * 15L;
        return shift.getStartTime().plus(Duration.ofMinutes(minutesOffset));
    }

    private List<Booking> sortQueueForDisplay(List<Booking> bookings) {
        return bookings.stream()
                .sorted(Comparator
                        .comparingInt((Booking booking) -> getQueueDisplayRank(booking.getStatus()))
                        .thenComparing(Booking::getPriorityScore, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Booking::getCheckInAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparingInt(this::getSlotSequence)
                        .thenComparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private int getQueueDisplayRank(Booking.BookingStatus status) {
        return switch (status) {
            case IN_CONSULTATION -> 0;
            case RESULTS_READY -> 1;
            case CHECKED_IN, WAITING -> 2;
            case BOOKED -> 3;
            case COMPLETED -> 4;
            default -> 5;
        };
    }

    private int getSlotSequence(Booking booking) {
        Slot slot = booking.getSlot();
        return slot != null && slot.getSequence() != null ? slot.getSequence() : 1;
    }
}
