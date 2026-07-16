package com.medilink.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.dto.AuthResponse;
import com.medilink.backend.dto.HospitalLoginRequest;
import com.medilink.backend.dto.HospitalRegisterRequest;
import com.medilink.backend.dto.OtpVerifyRequest;
import com.medilink.backend.dto.ResendOtpRequest;
import com.medilink.backend.service.HospitalAuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/hospital")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class HospitalAuthController {

    private final HospitalAuthService hospitalAuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerHospital(
            @RequestBody HospitalRegisterRequest request
    ) {
        return ResponseEntity.ok(hospitalAuthService.registerHospital(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyHospitalOtp(
            @RequestBody OtpVerifyRequest request
    ) {
        return ResponseEntity.ok(hospitalAuthService.verifyHospitalOtp(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendHospitalOtp(
            @RequestBody ResendOtpRequest request
    ) {
        return ResponseEntity.ok(hospitalAuthService.resendHospitalOtp(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginHospital(
            @RequestBody HospitalLoginRequest request
    ) {
        return ResponseEntity.ok(hospitalAuthService.loginHospital(request));
    }
}