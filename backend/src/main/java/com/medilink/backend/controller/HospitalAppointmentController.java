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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Appointment;
import com.medilink.backend.entity.AppointmentStatus;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.repository.AppointmentRepository;
import com.medilink.backend.repository.HospitalRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/hospital/appointments")
@RequiredArgsConstructor
public class HospitalAppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final HospitalRepository hospitalRepository;

    @GetMapping("/requests")
    public ResponseEntity<?> getPendingRequests(Authentication authentication) {
        Hospital hospital = getLoggedHospital(authentication);

        List<Map<String, Object>> appointments = appointmentRepository
                .findByHospitalAndStatusOrderByRequestedAtDesc(hospital, AppointmentStatus.PENDING)
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllAppointments(Authentication authentication) {
        Hospital hospital = getLoggedHospital(authentication);

        List<Map<String, Object>> appointments = appointmentRepository
                .findByHospitalOrderByRequestedAtDesc(hospital)
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(appointments);
    }

    @PutMapping("/{appointmentId}/accept")
    public ResponseEntity<?> acceptAppointment(
            @PathVariable Long appointmentId,
            Authentication authentication
    ) {
        Hospital hospital = getLoggedHospital(authentication);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getHospital().getId().equals(hospital.getId())) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "You cannot accept this appointment"
            ));
        }

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Only pending appointments can be accepted"
            ));
        }

        appointment.setStatus(AppointmentStatus.ACCEPTED);
        appointment.setRespondedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);

        return ResponseEntity.ok(Map.of(
                "message", "Appointment accepted successfully",
                "appointment", convertToMap(appointment)
        ));
    }

    @PutMapping("/{appointmentId}/reject")
    public ResponseEntity<?> rejectAppointment(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        Hospital hospital = getLoggedHospital(authentication);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getHospital().getId().equals(hospital.getId())) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "You cannot reject this appointment"
            ));
        }

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Only pending appointments can be rejected"
            ));
        }

        appointment.setStatus(AppointmentStatus.REJECTED);
        appointment.setRejectionReason(request.getOrDefault("rejectionReason", "Not available"));
        appointment.setRespondedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);

        return ResponseEntity.ok(Map.of(
                "message", "Appointment rejected successfully",
                "appointment", convertToMap(appointment)
        ));
    }

    private Hospital getLoggedHospital(Authentication authentication) {
        String hospitalEmail = authentication.getName();

        return hospitalRepository.findByAdminUser_Email(hospitalEmail)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
    }

    private Map<String, Object> convertToMap(Appointment appointment) {
        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", appointment.getId());
        map.put("appointmentDate", appointment.getAppointmentDate());
        map.put("appointmentTime", appointment.getAppointmentTime());
        map.put("reason", appointment.getReason());
        map.put("status", appointment.getStatus());
        map.put("rejectionReason", appointment.getRejectionReason());
        map.put("requestedAt", appointment.getRequestedAt());
        map.put("respondedAt", appointment.getRespondedAt());
        map.put("completedAt", appointment.getCompletedAt());

        map.put("patientId", appointment.getPatient().getId());
        map.put("patientCode", appointment.getPatient().getPatientId());
        map.put("patientName", appointment.getPatient().getUser().getFullName());
        map.put("patientEmail", appointment.getPatient().getUser().getEmail());
        map.put("patientPhone", appointment.getPatient().getUser().getPhone());
        map.put("patientPlace", appointment.getPatient().getPlaceName());

        map.put("doctorId", appointment.getDoctor().getId());
        map.put("doctorCode", appointment.getDoctor().getDoctorId());
        map.put("doctorName", appointment.getDoctor().getUser().getFullName());
        map.put("doctorEmail", appointment.getDoctor().getUser().getEmail());
        map.put("doctorPhone", appointment.getDoctor().getUser().getPhone());
        map.put("doctorSpecialization", appointment.getDoctor().getSpecialization());
        map.put("doctorQualification", appointment.getDoctor().getQualification());
        map.put("doctorExperience", appointment.getDoctor().getExperience());
        map.put("doctorStatus", appointment.getDoctor().getStatus());

        map.put("hospitalId", appointment.getHospital().getId());
        map.put("hospitalName", appointment.getHospital().getHospitalName());

        return map;
    }
}