package com.medilink.backend.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.medilink.backend.dto.ChangePasswordRequest;
import com.medilink.backend.dto.DoctorAuthResponse;
import com.medilink.backend.dto.DoctorStatusRequest;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.DoctorRepository;
import com.medilink.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorProfileService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public DoctorAuthResponse getDoctorProfile() {

        String doctorEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmailAndRole(doctorEmail, Role.ROLE_DOCTOR)
                .orElseThrow(() -> new RuntimeException("Doctor account not found"));

        Doctor doctor = doctorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        Hospital hospital = doctor.getHospital();

        return new DoctorAuthResponse(
                "Doctor profile fetched successfully",
                null,
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

    public String changePassword(ChangePasswordRequest request) {

        String doctorEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmailAndRole(doctorEmail, Role.ROLE_DOCTOR)
                .orElseThrow(() -> new RuntimeException("Doctor account not found"));

        if (request.getOldPassword() == null ||
                request.getNewPassword() == null ||
                request.getConfirmPassword() == null) {
            throw new RuntimeException("All password fields are required");
        }

        boolean oldPasswordMatches = passwordEncoder.matches(
                request.getOldPassword(),
                user.getPassword()
        );

        if (!oldPasswordMatches) {
            throw new RuntimeException("Old password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Password changed successfully";
    }

    public DoctorAuthResponse updateMyStatus(DoctorStatusRequest request) {

        String doctorEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmailAndRole(doctorEmail, Role.ROLE_DOCTOR)
                .orElseThrow(() -> new RuntimeException("Doctor account not found"));

        Doctor doctor = doctorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        if (request.getStatus() == null) {
            throw new RuntimeException("Doctor status is required");
        }

        doctor.setStatus(request.getStatus());

        Doctor savedDoctor = doctorRepository.save(doctor);

        Hospital hospital = savedDoctor.getHospital();

        return new DoctorAuthResponse(
                "Doctor status updated successfully",
                null,
                savedDoctor.getDoctorId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                savedDoctor.getSpecialization(),
                savedDoctor.getQualification(),
                savedDoctor.getExperience(),
                savedDoctor.getStatus(),
                hospital.getHospitalCode(),
                hospital.getHospitalName()
        );
    }
}