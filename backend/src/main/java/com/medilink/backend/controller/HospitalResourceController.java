package com.medilink.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.HospitalResource;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.HospitalRepository;
import com.medilink.backend.repository.HospitalResourceRepository;
import com.medilink.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class HospitalResourceController {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalResourceRepository hospitalResourceRepository;

    @GetMapping("/hospital/resources")
    public ResponseEntity<Map<String, Object>> getHospitalResources() {

        Hospital hospital = getLoggedInHospital();

        HospitalResource resource = hospitalResourceRepository.findByHospital(hospital)
                .orElseGet(() -> createDefaultResource(hospital));

        return ResponseEntity.ok(convertToMap(resource));
    }

    @PutMapping("/hospital/resources")
    public ResponseEntity<Map<String, Object>> updateHospitalResources(
            @RequestBody HospitalResource request
    ) {

        Hospital hospital = getLoggedInHospital();

        HospitalResource resource = hospitalResourceRepository.findByHospital(hospital)
                .orElseGet(() -> createDefaultResource(hospital));

        resource.setIcuBeds(request.getIcuBeds());
        resource.setGeneralBeds(request.getGeneralBeds());
        resource.setEmergencyBeds(request.getEmergencyBeds());
        resource.setVentilators(request.getVentilators());
        resource.setAmbulances(request.getAmbulances());
        resource.setOxygenCylinders(request.getOxygenCylinders());
        resource.setBloodUnits(request.getBloodUnits());

        HospitalResource savedResource = hospitalResourceRepository.save(resource);

        return ResponseEntity.ok(convertToMap(savedResource));
    }

    @GetMapping("/patient/hospital-resources")
    public ResponseEntity<List<Map<String, Object>>> getAllHospitalResourcesForPatient() {

        List<Map<String, Object>> resources = hospitalResourceRepository.findAll()
                .stream()
                .map(this::convertToMap)
                .toList();

        return ResponseEntity.ok(resources);
    }

    private Hospital getLoggedInHospital() {

        String adminEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User adminUser = userRepository.findByEmailAndRole(adminEmail, Role.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin account not found"));

        return hospitalRepository.findByAdminUser(adminUser)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
    }

    private HospitalResource createDefaultResource(Hospital hospital) {

        HospitalResource resource = HospitalResource.builder()
                .icuBeds(0)
                .generalBeds(0)
                .emergencyBeds(0)
                .ventilators(0)
                .ambulances(0)
                .oxygenCylinders(0)
                .bloodUnits(0)
                .hospital(hospital)
                .build();

        return hospitalResourceRepository.save(resource);
    }

    private Map<String, Object> convertToMap(HospitalResource resource) {

        Hospital hospital = resource.getHospital();

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("resourceId", resource.getId());

        map.put("hospitalId", hospital.getId());
        map.put("hospitalName", hospital.getHospitalName());
        map.put("hospitalCode", hospital.getHospitalCode());
        map.put("city", hospital.getCity());
        map.put("phone", hospital.getPhone());

        map.put("icuBeds", resource.getIcuBeds());
        map.put("generalBeds", resource.getGeneralBeds());
        map.put("emergencyBeds", resource.getEmergencyBeds());
        map.put("ventilators", resource.getVentilators());
        map.put("ambulances", resource.getAmbulances());
        map.put("oxygenCylinders", resource.getOxygenCylinders());
        map.put("bloodUnits", resource.getBloodUnits());

        map.put("updatedAt", resource.getUpdatedAt());

        return map;
    }
}