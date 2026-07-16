package com.medilink.backend.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.AccessRequestStatus;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.DoctorAccessRequest;
import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.PatientReport;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.SharedAccess;
import com.medilink.backend.entity.SharedAccessReport;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.DoctorAccessRequestRepository;
import com.medilink.backend.repository.DoctorRepository;
import com.medilink.backend.repository.SharedAccessReportRepository;
import com.medilink.backend.repository.SharedAccessRepository;
import com.medilink.backend.repository.UserRepository;
import com.medilink.backend.service.EmailService;
import com.medilink.backend.service.S3Service;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor/access")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorAccessController {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final SharedAccessRepository sharedAccessRepository;
    private final SharedAccessReportRepository sharedAccessReportRepository;
    private final DoctorAccessRequestRepository doctorAccessRequestRepository;
    private final S3Service s3Service;
    private final EmailService emailService;

    @Value("${backend.base.url:http://localhost:8081}")
    private String backendBaseUrl;

    @PostMapping("/request/{accessToken}")
    public ResponseEntity<Map<String, Object>> requestAccess(
            @PathVariable String accessToken
    ) {
        Doctor doctor = getLoggedInDoctor();

        SharedAccess sharedAccess = sharedAccessRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new RuntimeException("Invalid QR access link"));

        if (!sharedAccess.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createResponse("This QR access has been revoked"));
        }

        if (isExpired(sharedAccess)) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createResponse("This QR access link has expired"));
        }

        DoctorAccessRequest existingRequest = doctorAccessRequestRepository
                .findBySharedAccessAndDoctor(sharedAccess, doctor)
                .orElse(null);

        if (existingRequest != null) {

            if (existingRequest.getStatus() == AccessRequestStatus.PENDING) {

                if (
                        existingRequest.getEmailActionToken() == null ||
                        existingRequest.getEmailActionToken().trim().isEmpty()
                ) {
                    existingRequest.setEmailActionToken(UUID.randomUUID().toString());
                    existingRequest = doctorAccessRequestRepository.save(existingRequest);

                    sendAccessRequestEmailToPatient(
                            sharedAccess,
                            doctor,
                            existingRequest
                    );
                }

                Map<String, Object> response = createResponse(
                        "Access request already sent. Waiting for patient approval."
                );

                response.put("requestId", existingRequest.getId());
                response.put("status", existingRequest.getStatus());
                response.put("expiresAt", sharedAccess.getExpiresAt());

                return ResponseEntity.ok(response);
            }

            if (existingRequest.getStatus() == AccessRequestStatus.APPROVED) {
                Map<String, Object> response = createResponse(
                        "Access already approved. You can view reports now."
                );

                response.put("requestId", existingRequest.getId());
                response.put("status", existingRequest.getStatus());
                response.put("expiresAt", sharedAccess.getExpiresAt());

                return ResponseEntity.ok(response);
            }

            if (existingRequest.getStatus() == AccessRequestStatus.REJECTED) {
                existingRequest.setStatus(AccessRequestStatus.PENDING);
                existingRequest.setRequestedAt(LocalDateTime.now());
                existingRequest.setRespondedAt(null);
                existingRequest.setEmailActionToken(UUID.randomUUID().toString());

                DoctorAccessRequest savedRequest =
                        doctorAccessRequestRepository.save(existingRequest);

                sendAccessRequestEmailToPatient(
                        sharedAccess,
                        doctor,
                        savedRequest
                );

                Map<String, Object> response = createResponse(
                        "Access request sent again to patient. Email approve/reject buttons also sent."
                );

                response.put("requestId", savedRequest.getId());
                response.put("status", savedRequest.getStatus());
                response.put("patientId", sharedAccess.getPatient().getPatientId());
                response.put("patientName", sharedAccess.getPatient().getUser().getFullName());
                response.put("expiresAt", sharedAccess.getExpiresAt());
                response.put("expired", false);
                response.put("active", sharedAccess.isActive());

                return ResponseEntity.ok(response);
            }
        }

        DoctorAccessRequest accessRequest = DoctorAccessRequest.builder()
                .sharedAccess(sharedAccess)
                .doctor(doctor)
                .status(AccessRequestStatus.PENDING)
                .emailActionToken(UUID.randomUUID().toString())
                .build();

        DoctorAccessRequest savedRequest =
                doctorAccessRequestRepository.save(accessRequest);

        sendAccessRequestEmailToPatient(
                sharedAccess,
                doctor,
                savedRequest
        );

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Access request sent to patient. Email approve/reject buttons also sent.");
        response.put("requestId", savedRequest.getId());
        response.put("status", savedRequest.getStatus());
        response.put("patientId", sharedAccess.getPatient().getPatientId());
        response.put("patientName", sharedAccess.getPatient().getUser().getFullName());
        response.put("expiresAt", sharedAccess.getExpiresAt());
        response.put("expired", false);
        response.put("active", sharedAccess.isActive());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/{accessToken}")
    public ResponseEntity<Map<String, Object>> viewApprovedReports(
            @PathVariable String accessToken
    ) {
        Doctor doctor = getLoggedInDoctor();

        SharedAccess sharedAccess = sharedAccessRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new RuntimeException("Invalid QR access link"));

        if (!sharedAccess.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createResponse("This QR access has been revoked"));
        }

        if (isExpired(sharedAccess)) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createResponse("This QR access link has expired"));
        }

        DoctorAccessRequest approvedRequest = doctorAccessRequestRepository
                .findBySharedAccessAndDoctorAndStatus(
                        sharedAccess,
                        doctor,
                        AccessRequestStatus.APPROVED
                )
                .orElse(null);

        if (approvedRequest == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createResponse("Patient approval is required to view these reports"));
        }

        Patient patient = sharedAccess.getPatient();

        List<Map<String, Object>> reports = sharedAccessReportRepository
                .findBySharedAccess(sharedAccess)
                .stream()
                .map(this::convertReportToMap)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Reports fetched successfully");
        response.put("patientId", patient.getPatientId());
        response.put("patientName", patient.getUser().getFullName());
        response.put("doctorId", doctor.getDoctorId());
        response.put("doctorName", doctor.getUser().getFullName());
        response.put("reportsCount", reports.size());
        response.put("expiresAt", sharedAccess.getExpiresAt());
        response.put("expired", false);
        response.put("active", sharedAccess.isActive());
        response.put("reports", reports);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<Map<String, Object>>> getMyRequests() {
        Doctor doctor = getLoggedInDoctor();

        List<Map<String, Object>> requests = doctorAccessRequestRepository
                .findByDoctorOrderByRequestedAtDesc(doctor)
                .stream()
                .map(this::convertRequestToMap)
                .toList();

        return ResponseEntity.ok(requests);
    }

    private Doctor getLoggedInDoctor() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmailAndRole(email, Role.ROLE_DOCTOR)
                .orElseThrow(() -> new RuntimeException("Doctor account not found"));

        return doctorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
    }

    private boolean isExpired(SharedAccess sharedAccess) {
        return sharedAccess.getExpiresAt().isBefore(LocalDateTime.now());
    }

    private void sendAccessRequestEmailToPatient(
            SharedAccess sharedAccess,
            Doctor doctor,
            DoctorAccessRequest request
    ) {
        try {
            Patient patient = sharedAccess.getPatient();

            String patientEmail = patient.getUser().getEmail();
            String patientName = patient.getUser().getFullName();

            String doctorName = doctor.getUser().getFullName();
            String doctorId = doctor.getDoctorId();

            String specialization = doctor.getSpecialization();

            if (specialization == null || specialization.trim().isEmpty()) {
                specialization = "Not Available";
            }

            String hospitalName = "Not Available";

            if (doctor.getHospital() != null) {
                hospitalName = doctor.getHospital().getHospitalName();
            }

            int selectedReportsCount = sharedAccessReportRepository
                    .findBySharedAccess(sharedAccess)
                    .size();

            String approveLink = backendBaseUrl
                    + "/api/patient/access-requests/email/approve/"
                    + request.getEmailActionToken();

            String rejectLink = backendBaseUrl
                    + "/api/patient/access-requests/email/reject/"
                    + request.getEmailActionToken();

            emailService.sendDoctorAccessRequestActionEmail(
                    patientEmail,
                    patientName,
                    doctorName,
                    doctorId,
                    specialization,
                    hospitalName,
                    selectedReportsCount,
                    approveLink,
                    rejectLink
            );

        } catch (Exception e) {
            System.out.println("Access request email failed: " + e.getMessage());
        }
    }

    private Map<String, Object> convertReportToMap(
            SharedAccessReport sharedAccessReport
    ) {
        PatientReport report = sharedAccessReport.getPatientReport();

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("reportId", report.getId());
        map.put("reportTitle", report.getReportTitle());
        map.put("reportType", report.getReportType());
        map.put("description", report.getDescription());
        map.put("fileName", report.getFileName());
        map.put("fileType", report.getFileType());
        map.put("uploadedAt", report.getUploadedAt());

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

        return map;
    }

    private Map<String, Object> convertRequestToMap(
            DoctorAccessRequest request
    ) {
        SharedAccess sharedAccess = request.getSharedAccess();
        Patient patient = sharedAccess.getPatient();

        boolean expired = isExpired(sharedAccess);
        boolean currentlyUsable = sharedAccess.isActive() && !expired;

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("requestId", request.getId());
        map.put("status", request.getStatus());
        map.put("requestedAt", request.getRequestedAt());
        map.put("respondedAt", request.getRespondedAt());

        map.put("accessToken", sharedAccess.getAccessToken());
        map.put("expiresAt", sharedAccess.getExpiresAt());
        map.put("active", sharedAccess.isActive());
        map.put("expired", expired);
        map.put("currentlyUsable", currentlyUsable);

        map.put("patientId", patient.getPatientId());
        map.put("patientName", patient.getUser().getFullName());

        return map;
    }

    private Map<String, Object> createResponse(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        return response;
    }
}