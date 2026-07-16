package com.medilink.backend.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Appointment;
import com.medilink.backend.entity.AppointmentStatus;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.repository.AppointmentRepository;
import com.medilink.backend.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor/appointments")
@RequiredArgsConstructor
public class DoctorAppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    @GetMapping("/accepted")
    public ResponseEntity<?> getAcceptedAppointments(Authentication authentication) {
        Doctor doctor = getLoggedDoctor(authentication);

        List<Map<String, Object>> appointments = appointmentRepository
                .findByDoctorAndStatusOrderByAppointmentDateAscAppointmentTimeAsc(
                        doctor,
                        AppointmentStatus.ACCEPTED
                )
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllDoctorAppointments(Authentication authentication) {
        Doctor doctor = getLoggedDoctor(authentication);

        List<Map<String, Object>> appointments = appointmentRepository
                .findByDoctorOrderByAppointmentDateAscAppointmentTimeAsc(doctor)
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(appointments);
    }

    @PutMapping("/{appointmentId}/complete")
    public ResponseEntity<?> markCompleted(
            @PathVariable Long appointmentId,
            Authentication authentication
    ) {
        Doctor doctor = getLoggedDoctor(authentication);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "You cannot complete this appointment"
            ));
        }

        if (appointment.getStatus() != AppointmentStatus.ACCEPTED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Only accepted appointments can be completed"
            ));
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setCompletedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);

        return ResponseEntity.ok(Map.of(
                "message", "Appointment marked as completed",
                "appointment", convertToMap(appointment)
        ));
    }

    private Doctor getLoggedDoctor(Authentication authentication) {
        String doctorEmail = authentication.getName();

        return doctorRepository.findByUser_Email(doctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    private Map<String, Object> convertToMap(Appointment appointment) {
        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", appointment.getId());
        map.put("appointmentDate", appointment.getAppointmentDate());
        map.put("appointmentTime", appointment.getAppointmentTime());
        map.put("reason", appointment.getReason());
        map.put("status", appointment.getStatus());
        map.put("requestedAt", appointment.getRequestedAt());

        map.put("patientId", appointment.getPatient().getId());
map.put("patientCode", appointment.getPatient().getPatientId());
map.put("patientName", appointment.getPatient().getUser().getFullName());
map.put("patientEmail", appointment.getPatient().getUser().getEmail());
map.put("patientPhone", appointment.getPatient().getUser().getPhone());
map.put("patientPlace", appointment.getPatient().getPlaceName());

        map.put("hospitalName", appointment.getHospital().getHospitalName());
        

        return map;
    }
}