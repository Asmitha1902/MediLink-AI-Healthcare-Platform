package com.medilink.backend.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Appointment;
import com.medilink.backend.entity.AppointmentStatus;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.Patient;
import com.medilink.backend.repository.AppointmentRepository;
import com.medilink.backend.repository.DoctorRepository;
import com.medilink.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient/appointments")
@RequiredArgsConstructor
public class PatientAppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @PostMapping("/request/{doctorId}")
    public ResponseEntity<?> requestAppointment(
            @PathVariable Long doctorId,
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String patientEmail = authentication.getName();

        Patient patient = patientRepository.findByUser_Email(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (doctor.getHospital() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Doctor is not linked with any hospital"
            ));
        }

        String dateValue = request.get("appointmentDate");
        String timeValue = request.get("appointmentTime");

        if (dateValue == null || dateValue.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Appointment date is required"
            ));
        }

        if (timeValue == null || timeValue.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Appointment time is required"
            ));
        }

        LocalDate appointmentDate = LocalDate.parse(dateValue);
        LocalTime appointmentTime = LocalTime.parse(timeValue);
        String reason = request.getOrDefault("reason", "");

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .hospital(doctor.getHospital())
                .appointmentDate(appointmentDate)
                .appointmentTime(appointmentTime)
                .reason(reason)
                .status(AppointmentStatus.PENDING)
                .build();

        appointmentRepository.save(appointment);

        return ResponseEntity.ok(Map.of(
                "message", "Appointment request sent to hospital successfully",
                "appointment", convertToMap(appointment)
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyAppointments(Authentication authentication) {
        String patientEmail = authentication.getName();

        Patient patient = patientRepository.findByUser_Email(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        List<Map<String, Object>> appointments = appointmentRepository
                .findByPatientOrderByRequestedAtDesc(patient)
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(appointments);
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
        map.put("specialization", appointment.getDoctor().getSpecialization());
        map.put("qualification", appointment.getDoctor().getQualification());
        map.put("experience", appointment.getDoctor().getExperience());
        map.put("doctorStatus", appointment.getDoctor().getStatus());

        map.put("hospitalId", appointment.getHospital().getId());
        map.put("hospitalName", appointment.getHospital().getHospitalName());

        return map;
    }
}