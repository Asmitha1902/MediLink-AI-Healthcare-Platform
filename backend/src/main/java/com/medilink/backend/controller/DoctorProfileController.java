package com.medilink.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.dto.ChangePasswordRequest;
import com.medilink.backend.dto.DoctorAuthResponse;
import com.medilink.backend.dto.DoctorStatusRequest;
import com.medilink.backend.service.DoctorProfileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorProfileController {

    private final DoctorProfileService doctorProfileService;

    @GetMapping("/profile")
    public ResponseEntity<DoctorAuthResponse> getDoctorProfile() {
        return ResponseEntity.ok(doctorProfileService.getDoctorProfile());
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest request
    ) {
        String message = doctorProfileService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PutMapping("/my-status")
    public ResponseEntity<DoctorAuthResponse> updateMyStatus(
            @RequestBody DoctorStatusRequest request
    ) {
        return ResponseEntity.ok(
                doctorProfileService.updateMyStatus(request)
        );
    }
}