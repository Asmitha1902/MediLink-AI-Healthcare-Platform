package com.medilink.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.PatientReport;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.PatientReportRepository;
import com.medilink.backend.repository.PatientRepository;
import com.medilink.backend.repository.UserRepository;
import com.medilink.backend.service.S3Service;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PatientReportController {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PatientReportRepository patientReportRepository;
    private final S3Service s3Service;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadReport(
            @RequestParam("reportTitle") String reportTitle,
            @RequestParam("reportType") String reportType,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file
    ) {
        Patient patient = getLoggedInPatient();

        Map<String, String> uploadedFile = s3Service.uploadFile(
                file,
                "patient-reports/" + patient.getPatientId()
        );

        PatientReport report = PatientReport.builder()
                .reportTitle(reportTitle)
                .reportType(reportType)
                .description(description)
                .fileName(uploadedFile.get("fileName"))
                .fileUrl(null)
                .s3Key(uploadedFile.get("s3Key"))
                .fileType(uploadedFile.get("fileType"))
                .patient(patient)
                .build();

        PatientReport savedReport = patientReportRepository.save(report);

        return ResponseEntity.ok(
                convertToMap("Report uploaded successfully", savedReport)
        );
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyReports() {

        Patient patient = getLoggedInPatient();

        List<Map<String, Object>> reports = patientReportRepository
                .findByPatientOrderByUploadedAtDesc(patient)
                .stream()
                .map(report -> convertToMap("Report fetched successfully", report))
                .toList();

        return ResponseEntity.ok(reports);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getReportCount() {

        Patient patient = getLoggedInPatient();

        long count = patientReportRepository.countByPatient(patient);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("count", count);

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

    private Map<String, Object> convertToMap(String message, PatientReport report) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("message", message);
        map.put("reportId", report.getId());
        map.put("reportTitle", report.getReportTitle());
        map.put("reportType", report.getReportType());
        map.put("description", report.getDescription());
        map.put("fileName", report.getFileName());

        if (report.getS3Key() != null) {
    map.put("fileUrl", s3Service.generatePresignedUrl(report.getS3Key()));
    map.put(
            "downloadUrl",
            s3Service.generateDownloadPresignedUrl(
                    report.getS3Key(),
                    report.getFileName()
            )
    );
} else {
    map.put("fileUrl", null);
    map.put("downloadUrl", null);
}

        map.put("s3Key", report.getS3Key());
        map.put("fileType", report.getFileType());
        map.put("uploadedAt", report.getUploadedAt());

        return map;
    }
}