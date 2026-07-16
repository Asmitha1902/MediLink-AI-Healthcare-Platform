package com.medilink.backend.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.AccessRequestStatus;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.DoctorAccessRequest;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.SharedAccess;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.DoctorAccessRequestRepository;
import com.medilink.backend.repository.PatientRepository;
import com.medilink.backend.repository.SharedAccessReportRepository;
import com.medilink.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient/access-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PatientAccessRequestController {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorAccessRequestRepository doctorAccessRequestRepository;
    private final SharedAccessReportRepository sharedAccessReportRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAccessRequests() {

        Patient patient = getLoggedInPatient();

        List<Map<String, Object>> requests = doctorAccessRequestRepository
                .findBySharedAccessPatientOrderByRequestedAtDesc(patient)
                .stream()
                .map(this::convertRequestToMap)
                .toList();

        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{requestId}/approve")
    public ResponseEntity<Map<String, Object>> approveAccessRequest(
            @PathVariable Long requestId
    ) {
        Patient patient = getLoggedInPatient();

        DoctorAccessRequest request = doctorAccessRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Access request not found"));

        validatePatientRequestOwner(request, patient);
        validateRequestCanBeApproved(request);

        request.setStatus(AccessRequestStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());

        DoctorAccessRequest savedRequest = doctorAccessRequestRepository.save(request);

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Doctor access approved successfully");
        response.put("request", convertRequestToMap(savedRequest));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestId}/reject")
    public ResponseEntity<Map<String, Object>> rejectAccessRequest(
            @PathVariable Long requestId
    ) {
        Patient patient = getLoggedInPatient();

        DoctorAccessRequest request = doctorAccessRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Access request not found"));

        validatePatientRequestOwner(request, patient);

        request.setStatus(AccessRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());

        DoctorAccessRequest savedRequest = doctorAccessRequestRepository.save(request);

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Doctor access rejected successfully");
        response.put("request", convertRequestToMap(savedRequest));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/email/approve/{emailActionToken}")
    public ResponseEntity<String> approveFromEmail(
            @PathVariable String emailActionToken
    ) {
        DoctorAccessRequest request = doctorAccessRequestRepository
                .findByEmailActionToken(emailActionToken)
                .orElse(null);

        if (request == null) {
            return htmlResponse(
                    "Invalid Link",
                    "This approval link is invalid or already removed."
            );
        }

        SharedAccess sharedAccess = request.getSharedAccess();

        if (!sharedAccess.isActive()) {
            return htmlResponse(
                    "QR Access Revoked",
                    "This QR access has been revoked by the patient."
            );
        }

        if (isExpired(sharedAccess)) {
            return htmlResponse(
                    "QR Access Expired",
                    "This QR access link has expired. Doctor cannot access reports using this QR."
            );
        }

        if (request.getStatus() == AccessRequestStatus.APPROVED) {
            return htmlResponse(
                    "Already Approved",
                    "You have already approved this doctor access request."
            );
        }

        if (request.getStatus() == AccessRequestStatus.REJECTED) {
            return htmlResponse(
                    "Already Rejected",
                    "You have already rejected this doctor access request."
            );
        }

        request.setStatus(AccessRequestStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());

        doctorAccessRequestRepository.save(request);

        return htmlResponse(
                "Request Approved",
                "Doctor access has been approved successfully. The doctor can now view the selected reports before QR expiry."
        );
    }

    @GetMapping("/email/reject/{emailActionToken}")
    public ResponseEntity<String> rejectFromEmail(
            @PathVariable String emailActionToken
    ) {
        DoctorAccessRequest request = doctorAccessRequestRepository
                .findByEmailActionToken(emailActionToken)
                .orElse(null);

        if (request == null) {
            return htmlResponse(
                    "Invalid Link",
                    "This rejection link is invalid or already removed."
            );
        }

        if (request.getStatus() == AccessRequestStatus.APPROVED) {
            return htmlResponse(
                    "Already Approved",
                    "This doctor access request is already approved."
            );
        }

        if (request.getStatus() == AccessRequestStatus.REJECTED) {
            return htmlResponse(
                    "Already Rejected",
                    "You have already rejected this doctor access request."
            );
        }

        request.setStatus(AccessRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());

        doctorAccessRequestRepository.save(request);

        return htmlResponse(
                "Request Rejected",
                "Doctor access request has been rejected successfully."
        );
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

    private void validatePatientRequestOwner(
            DoctorAccessRequest request,
            Patient patient
    ) {
        Patient requestPatient = request.getSharedAccess().getPatient();

        if (!requestPatient.getId().equals(patient.getId())) {
            throw new RuntimeException("You cannot update another patient's access request");
        }
    }

    private void validateRequestCanBeApproved(
            DoctorAccessRequest request
    ) {
        SharedAccess sharedAccess = request.getSharedAccess();

        if (!sharedAccess.isActive()) {
            throw new RuntimeException("This QR access has been revoked");
        }

        if (isExpired(sharedAccess)) {
            throw new RuntimeException("This QR access link has expired");
        }
    }

    private boolean isExpired(SharedAccess sharedAccess) {
        return sharedAccess.getExpiresAt().isBefore(LocalDateTime.now());
    }

    private Map<String, Object> convertRequestToMap(
            DoctorAccessRequest request
    ) {
        SharedAccess sharedAccess = request.getSharedAccess();
        Doctor doctor = request.getDoctor();
        User doctorUser = doctor.getUser();
        Hospital hospital = doctor.getHospital();

        int selectedReportsCount = sharedAccessReportRepository
                .findBySharedAccess(sharedAccess)
                .size();

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
        map.put("selectedReportsCount", selectedReportsCount);

        map.put("doctorId", doctor.getDoctorId());
        map.put("doctorName", doctorUser.getFullName());
        map.put("doctorEmail", doctorUser.getEmail());
        map.put("doctorPhone", doctorUser.getPhone());
        map.put("specialization", doctor.getSpecialization());
        map.put("qualification", doctor.getQualification());
        map.put("experience", doctor.getExperience());

        if (hospital != null) {
            map.put("hospitalName", hospital.getHospitalName());
            map.put("hospitalCode", hospital.getHospitalCode());
            map.put("hospitalCity", hospital.getCity());
        } else {
            map.put("hospitalName", "Not Available");
            map.put("hospitalCode", "Not Available");
            map.put("hospitalCity", "Not Available");
        }

        return map;
    }

    private ResponseEntity<String> htmlResponse(
            String title,
            String message
    ) {
        String html =
                "<html>" +
                        "<body style='font-family:Arial,sans-serif;background:#f8fafc;padding:40px;'>" +
                        "<div style='max-width:620px;margin:auto;background:white;padding:32px;border-radius:18px;border:1px solid #d1fae5;text-align:center;'>" +
                        "<h2 style='color:#064e3b;margin-bottom:14px;'>" + title + "</h2>" +
                        "<p style='color:#334155;font-size:16px;line-height:1.6;'>" + message + "</p>" +
                        "<p style='color:#64748b;margin-top:24px;font-size:14px;'>You can close this page now.</p>" +
                        "</div>" +
                        "</body>" +
                        "</html>";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);

        return ResponseEntity.ok()
                .headers(headers)
                .body(html);
    }
}