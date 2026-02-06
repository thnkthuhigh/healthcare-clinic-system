package com.clinic.backend.modules.doctor.service;

import com.clinic.backend.modules.doctor.dto.*;
import com.clinic.backend.modules.doctor.entity.*;
import com.clinic.backend.modules.doctor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ShiftRepository shiftRepository;
    private final BookingRepository bookingRepository;

    public DoctorService(
            DoctorRepository doctorRepository,
            ShiftRepository shiftRepository,
            BookingRepository bookingRepository) {
        this.doctorRepository = doctorRepository;
        this.shiftRepository = shiftRepository;
        this.bookingRepository = bookingRepository;
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
        List<Booking.BookingStatus> statuses;
        
        if (statusFilter == null || statusFilter.equalsIgnoreCase("ALL")) {
            statuses = Arrays.asList(
                Booking.BookingStatus.CHECKED_IN,
                Booking.BookingStatus.WAITING,
                Booking.BookingStatus.IN_CONSULTATION,
                Booking.BookingStatus.RESULTS_READY,
                Booking.BookingStatus.COMPLETED
            );
        } else {
            statuses = List.of(Booking.BookingStatus.valueOf(statusFilter.toUpperCase()));
        }
        
        List<Booking> bookings = bookingRepository.findQueueByShiftId(shiftId, statuses);
        return bookings.stream().map(this::toQueueItemDto).toList();
    }

    /**
     * Get all bookings for a shift (unfiltered)
     */
    public List<QueueItemDto> getAllBookingsByShift(UUID shiftId) {
        List<Booking> bookings = bookingRepository.findAllByShiftId(shiftId);
        return bookings.stream().map(this::toQueueItemDto).toList();
    }

    // ========== Mappers ==========
    
    private DoctorDto toDto(Doctor doctor) {
        return new DoctorDto(
            doctor.getId(),
            doctor.getDisplayName(),
            doctor.getSpecialty(),
            doctor.getAvatarUrl(),
            doctor.getUser().getPhone()
        );
    }

    private ShiftDto toShiftDto(Shift shift) {
        UUID shiftId = shift.getId();
        
        long total = bookingRepository.countByShiftId(shiftId);
        long waiting = bookingRepository.countByShiftIdAndStatus(shiftId, Booking.BookingStatus.WAITING) +
                       bookingRepository.countByShiftIdAndStatus(shiftId, Booking.BookingStatus.CHECKED_IN);
        long checkedIn = bookingRepository.countByShiftIdAndStatus(shiftId, Booking.BookingStatus.CHECKED_IN);
        long inConsultation = bookingRepository.countByShiftIdAndStatus(shiftId, Booking.BookingStatus.IN_CONSULTATION);
        long completed = bookingRepository.countByShiftIdAndStatus(shiftId, Booking.BookingStatus.COMPLETED);
        
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
            completed
        );
    }

    private QueueItemDto toQueueItemDto(Booking booking) {
        Patient patient = booking.getPatient();
        PatientDto patientDto = new PatientDto(
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
            patient.getAddress()
        );
        
        return new QueueItemDto(
            booking.getId(),
            booking.getQueueNumber(),
            patientDto,
            booking.getService() != null ? booking.getService().getName() : null,
            booking.getStatus(),
            booking.getChannel(),
            booking.getCheckInAt(),
            booking.getPriorityScore(),
            booking.getSkipCount()
        );
    }
}
