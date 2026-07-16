package com.medilink.backend.controller;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.PatientReport;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.SharedAccess;
import com.medilink.backend.entity.SharedAccessReport;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.PatientReportRepository;
import com.medilink.backend.repository.PatientRepository;
import com.medilink.backend.repository.SharedAccessReportRepository;
import com.medilink.backend.repository.SharedAccessRepository;
import com.medilink.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient/share")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PatientShareController {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PatientReportRepository patientReportRepository;
    private final SharedAccessRepository sharedAccessRepository;
    private final SharedAccessReportRepository sharedAccessReportRepository;

    @Value("${frontend.base.url:http://localhost:5173}")
    private String frontendBaseUrl;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateShareAccess(
            @RequestBody Map<String, Object> request
    ) {
        Patient patient = getLoggedInPatient();

        List<?> reportIdsRaw = (List<?>) request.get("reportIds");

        if (reportIdsRaw == null || reportIdsRaw.isEmpty()) {
            throw new RuntimeException("Please select at least one report");
        }

        int expiryMinutes = getValidExpiryMinutes(request.get("expiryMinutes"));

        String accessToken = UUID.randomUUID().toString();

        SharedAccess sharedAccess = SharedAccess.builder()
                .accessToken(accessToken)
                .patient(patient)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .active(true)
                .build();

        SharedAccess savedAccess = sharedAccessRepository.save(sharedAccess);

        for (Object reportIdObj : reportIdsRaw) {
            Long reportId = Long.valueOf(reportIdObj.toString());

            PatientReport report = patientReportRepository.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found"));

            if (!report.getPatient().getId().equals(patient.getId())) {
                throw new RuntimeException("You cannot share another patient's report");
            }

            SharedAccessReport sharedReport = SharedAccessReport.builder()
                    .sharedAccess(savedAccess)
                    .patientReport(report)
                    .build();

            sharedAccessReportRepository.save(sharedReport);
        }

        Map<String, Object> response = convertToMap(savedAccess);

        response.put("message", "QR access generated successfully");
        response.put("expiryMinutes", expiryMinutes);
        response.put("selectedReportsCount", reportIdsRaw.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getShareHistory() {
        Patient patient = getLoggedInPatient();

        List<Map<String, Object>> history = sharedAccessRepository
                .findByPatientOrderByCreatedAtDesc(patient)
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(history);
    }

    @PutMapping("/revoke/{accessId}")
    public ResponseEntity<Map<String, Object>> revokeAccess(
            @PathVariable Long accessId
    ) {
        Patient patient = getLoggedInPatient();

        SharedAccess sharedAccess = sharedAccessRepository.findById(accessId)
                .orElseThrow(() -> new RuntimeException("Shared access not found"));

        if (!sharedAccess.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("You cannot revoke another patient's access");
        }

        sharedAccess.setActive(false);

        SharedAccess savedAccess = sharedAccessRepository.save(sharedAccess);

        Map<String, Object> response = convertToMap(savedAccess);

        response.put("message", "Shared access revoked successfully");

        return ResponseEntity.ok(response);
    }

    private Patient getLoggedInPatient() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmailAndRole(email, Role.ROLE_PATIENT)
                .orElseThrow(() -> new RuntimeException("Patient account not found"));

        return patientRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
    }

    private int getValidExpiryMinutes(Object expiryValue) {
        int expiryMinutes = 60;

        if (expiryValue != null) {
            try {
                expiryMinutes = Integer.parseInt(expiryValue.toString());
            } catch (Exception e) {
                expiryMinutes = 60;
            }
        }

        if (expiryMinutes < 5) {
            expiryMinutes = 5;
        }

        if (expiryMinutes > 1440) {
            expiryMinutes = 1440;
        }

        return expiryMinutes;
    }

    private Map<String, Object> convertToMap(SharedAccess sharedAccess) {
        Map<String, Object> map = new LinkedHashMap<>();

        String accessLink = frontendBaseUrl + "/qr-access/" + sharedAccess.getAccessToken();

        boolean expired = sharedAccess.getExpiresAt().isBefore(LocalDateTime.now());
        boolean currentlyUsable = sharedAccess.isActive() && !expired;

        int selectedReportsCount = sharedAccessReportRepository
                .findBySharedAccess(sharedAccess)
                .size();

        long expiryMinutes = 0;

        if (sharedAccess.getCreatedAt() != null && sharedAccess.getExpiresAt() != null) {
            expiryMinutes = Duration.between(
                    sharedAccess.getCreatedAt(),
                    sharedAccess.getExpiresAt()
            ).toMinutes();
        }

        map.put("accessId", sharedAccess.getId());
        map.put("accessToken", sharedAccess.getAccessToken());
        map.put("accessLink", accessLink);

        map.put("createdAt", sharedAccess.getCreatedAt());
        map.put("expiresAt", sharedAccess.getExpiresAt());
        map.put("expiryMinutes", expiryMinutes);

        map.put("active", sharedAccess.isActive());
        map.put("expired", expired);
        map.put("currentlyUsable", currentlyUsable);

        map.put("selectedReportsCount", selectedReportsCount);

        if (!sharedAccess.isActive()) {
            map.put("status", "REVOKED");
        } else if (expired) {
            map.put("status", "EXPIRED");
        } else {
            map.put("status", "ACTIVE");
        }

        return map;
    }
}