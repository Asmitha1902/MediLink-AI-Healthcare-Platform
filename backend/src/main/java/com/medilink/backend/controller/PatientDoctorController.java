package com.medilink.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PatientDoctorController {

    private final DoctorRepository doctorRepository;

    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> getAllDoctorsForPatient() {

        List<Map<String, Object>> doctors = doctorRepository.findAll()
                .stream()
                .map(this::convertDoctorToMap)
                .toList();

        return ResponseEntity.ok(doctors);
    }

    private Map<String, Object> convertDoctorToMap(Doctor doctor) {

        User user = doctor.getUser();
        Hospital hospital = doctor.getHospital();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", doctor.getId());
        map.put("doctorId", doctor.getDoctorId());
        map.put("doctorName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());

        map.put("specialization", doctor.getSpecialization());
        map.put("qualification", doctor.getQualification());
        map.put("experience", doctor.getExperience());
        map.put("status", doctor.getStatus());

        map.put("queueCount", doctor.getQueueCount());
        map.put("currentToken", doctor.getCurrentToken());
        map.put("averageWaitingTime", doctor.getAverageWaitingTime());

        map.put("hospitalId", hospital.getId());
        map.put("hospitalName", hospital.getHospitalName());
        map.put("hospitalCode", hospital.getHospitalCode());
        map.put("city", hospital.getCity());

        return map;
    }
}