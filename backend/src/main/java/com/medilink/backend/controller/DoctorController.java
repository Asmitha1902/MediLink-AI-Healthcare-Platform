package com.medilink.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.dto.DoctorAddRequest;
import com.medilink.backend.dto.DoctorResponse;
import com.medilink.backend.dto.DoctorStatusRequest;
import com.medilink.backend.service.DoctorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping("/add")
    public ResponseEntity<DoctorResponse> addDoctor(
            @RequestBody DoctorAddRequest request
    ) {
        return ResponseEntity.ok(doctorService.addDoctor(request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctorsForHospital());
    }

    @PutMapping("/{doctorId}/status")
    public ResponseEntity<DoctorResponse> updateDoctorStatus(
            @PathVariable String doctorId,
            @RequestBody DoctorStatusRequest request
    ) {
        return ResponseEntity.ok(
                doctorService.updateDoctorStatus(doctorId, request)
        );
    }

    @PutMapping("/{doctorId}/queue")
    public ResponseEntity<DoctorResponse> updateDoctorQueue(
            @PathVariable String doctorId,
            @RequestBody Map<String, Integer> request
    ) {
        return ResponseEntity.ok(
                doctorService.updateDoctorQueue(doctorId, request)
        );
    }
}