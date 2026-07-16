package com.medilink.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.dto.OtpVerifyRequest;
import com.medilink.backend.dto.PatientAuthResponse;
import com.medilink.backend.dto.PatientLoginRequest;
import com.medilink.backend.dto.PatientRegisterRequest;
import com.medilink.backend.dto.ResendOtpRequest;
import com.medilink.backend.service.PatientAuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PatientAuthController {

    private final PatientAuthService patientAuthService;

    @PostMapping("/register")
    public ResponseEntity<PatientAuthResponse> registerPatient(
            @RequestBody PatientRegisterRequest request
    ) {
        return ResponseEntity.ok(patientAuthService.registerPatient(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<PatientAuthResponse> verifyPatientOtp(
            @RequestBody OtpVerifyRequest request
    ) {
        return ResponseEntity.ok(patientAuthService.verifyPatientOtp(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<PatientAuthResponse> resendPatientOtp(
            @RequestBody ResendOtpRequest request
    ) {
        return ResponseEntity.ok(patientAuthService.resendPatientOtp(request));
    }

    @PostMapping("/login")
    public ResponseEntity<PatientAuthResponse> loginPatient(
            @RequestBody PatientLoginRequest request
    ) {
        return ResponseEntity.ok(patientAuthService.loginPatient(request));
    }
}