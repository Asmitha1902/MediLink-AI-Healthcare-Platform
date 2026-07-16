package com.medilink.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.medilink.backend.dto.DoctorAuthResponse;
import com.medilink.backend.dto.DoctorLoginRequest;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.DoctorRepository;
import com.medilink.backend.repository.UserRepository;
import com.medilink.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorAuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public DoctorAuthResponse loginDoctor(DoctorLoginRequest request) {

        String identifier = request.getIdentifier().trim();

        Doctor doctor;
        User user;

        if (identifier.contains("@")) {
            user = userRepository.findByEmailAndRole(
                            identifier.toLowerCase(),
                            Role.ROLE_DOCTOR
                    )
                    .orElseThrow(() -> new RuntimeException("Invalid Doctor ID/Email or password"));

            doctor = doctorRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
        } else {
            doctor = doctorRepository.findByDoctorId(identifier.toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Invalid Doctor ID/Email or password"));

            user = doctor.getUser();
        }

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new RuntimeException("Invalid Doctor ID/Email or password");
        }

        String token = jwtService.generateToken(user);

        Hospital hospital = doctor.getHospital();

        return new DoctorAuthResponse(
                "Doctor login successful",
                token,
                doctor.getDoctorId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getExperience(),
                doctor.getStatus(),
                hospital.getHospitalCode(),
                hospital.getHospitalName()
        );
    }
}