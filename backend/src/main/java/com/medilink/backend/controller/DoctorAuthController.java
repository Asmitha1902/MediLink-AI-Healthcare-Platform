package com.medilink.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.dto.DoctorAuthResponse;
import com.medilink.backend.dto.DoctorLoginRequest;
import com.medilink.backend.service.DoctorAuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorAuthController {

    private final DoctorAuthService doctorAuthService;

    @PostMapping("/login")
    public ResponseEntity<DoctorAuthResponse> loginDoctor(
            @RequestBody DoctorLoginRequest request
    ) {
        return ResponseEntity.ok(doctorAuthService.loginDoctor(request));
    }
}