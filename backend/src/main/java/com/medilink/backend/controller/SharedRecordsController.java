package com.medilink.backend.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.PatientReport;
import com.medilink.backend.entity.SharedAccess;
import com.medilink.backend.entity.SharedAccessReport;
import com.medilink.backend.repository.SharedAccessReportRepository;
import com.medilink.backend.repository.SharedAccessRepository;
import com.medilink.backend.service.S3Service;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/shared-records")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SharedRecordsController {

    private final SharedAccessRepository sharedAccessRepository;
    private final SharedAccessReportRepository sharedAccessReportRepository;
    private final S3Service s3Service;

    @GetMapping("/{accessToken}")
    public ResponseEntity<Map<String, Object>> getSharedRecords(
            @PathVariable String accessToken
    ) {
        SharedAccess sharedAccess = sharedAccessRepository.findByAccessToken(accessToken)
                .orElse(null);

        if (sharedAccess == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Invalid QR access link"));
        }

        if (!sharedAccess.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("This shared access has been revoked"));
        }

        if (sharedAccess.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("This QR access link has expired"));
        }

        Patient patient = sharedAccess.getPatient();

        List<Map<String, Object>> reports = sharedAccessReportRepository
                .findBySharedAccess(sharedAccess)
                .stream()
                .map(this::convertSharedReportToMap)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Shared records fetched successfully");
        response.put("accessId", sharedAccess.getId());
        response.put("accessToken", sharedAccess.getAccessToken());
        response.put("patientId", patient.getPatientId());
        response.put("patientName", patient.getUser().getFullName());
        response.put("expiresAt", sharedAccess.getExpiresAt());
        response.put("active", sharedAccess.isActive());
        response.put("reportsCount", reports.size());
        response.put("reports", reports);

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> convertSharedReportToMap(
            SharedAccessReport sharedAccessReport
    ) {
        PatientReport report = sharedAccessReport.getPatientReport();

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("reportId", report.getId());
        map.put("reportTitle", report.getReportTitle());
        map.put("reportType", report.getReportType());
        map.put("description", report.getDescription());
        map.put("fileName", report.getFileName());

        if (report.getS3Key() != null) {
            map.put("fileUrl", s3Service.generatePresignedUrl(report.getS3Key()));
        } else {
            map.put("fileUrl", null);
        }

        map.put("s3Key", report.getS3Key());
        map.put("fileType", report.getFileType());
        map.put("uploadedAt", report.getUploadedAt());

        return map;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        return response;
    }
}