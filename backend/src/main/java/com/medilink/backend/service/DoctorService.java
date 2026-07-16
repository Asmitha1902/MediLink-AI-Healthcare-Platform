package com.medilink.backend.service;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medilink.backend.dto.DoctorAddRequest;
import com.medilink.backend.dto.DoctorResponse;
import com.medilink.backend.dto.DoctorStatusRequest;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.DoctorStatus;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.DoctorRepository;
import com.medilink.backend.repository.HospitalRepository;
import com.medilink.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional(rollbackFor = Exception.class)
    public DoctorResponse addDoctor(DoctorAddRequest request) {

        validateDoctorRequest(request);

        String adminEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User adminUser = userRepository.findByEmailAndRole(adminEmail, Role.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin account not found"));

        Hospital hospital = hospitalRepository.findByAdminUser(adminUser)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        String doctorEmail = request.getEmail().trim().toLowerCase();

        Optional<User> existingDoctorUserOptional =
                userRepository.findByEmailAndRole(doctorEmail, Role.ROLE_DOCTOR);

        if (existingDoctorUserOptional.isPresent()) {

            User existingDoctorUser = existingDoctorUserOptional.get();

            Optional<Doctor> existingDoctorProfile =
                    doctorRepository.findByUser(existingDoctorUser);

            if (existingDoctorProfile.isPresent()) {
                throw new RuntimeException("Doctor already added with this email");
            }

            userRepository.delete(existingDoctorUser);
            userRepository.flush();
        }

        if (userRepository.existsByEmail(doctorEmail)) {
            throw new RuntimeException("This email is already used by another account");
        }

        String temporaryPassword = generateTemporaryPassword();

        User doctorUser = User.builder()
                .fullName(request.getDoctorName().trim())
                .email(doctorEmail)
                .phone(request.getPhone().trim())
                .password(passwordEncoder.encode(temporaryPassword))
                .role(Role.ROLE_DOCTOR)
                .emailVerified(true)
                .otpCode(null)
                .otpExpiry(null)
                .build();

        User savedDoctorUser = userRepository.save(doctorUser);

        String doctorId = generateDoctorId(hospital);

        Doctor doctor = Doctor.builder()
                .doctorId(doctorId)
                .specialization(request.getSpecialization().trim())
                .qualification(request.getQualification().trim())
                .experience(request.getExperience())
                .status(DoctorStatus.AVAILABLE)
                .queueCount(0)
                .currentToken(0)
                .averageWaitingTime(0)
                .user(savedDoctorUser)
                .hospital(hospital)
                .build();

        Doctor savedDoctor = doctorRepository.save(doctor);

        try {
            emailService.sendDoctorCredentials(
                    savedDoctorUser.getEmail(),
                    savedDoctorUser.getFullName(),
                    savedDoctor.getDoctorId(),
                    temporaryPassword,
                    hospital.getHospitalName()
            );
        } catch (Exception e) {
            throw new RuntimeException(
                    "Doctor credentials email failed. Doctor account was not created. Please try again."
            );
        }

        return mapToDoctorResponse(
                "Doctor added successfully. Credentials sent to doctor email.",
                savedDoctor
        );
    }

    public List<DoctorResponse> getAllDoctorsForHospital() {

        String adminEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User adminUser = userRepository.findByEmailAndRole(adminEmail, Role.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin account not found"));

        Hospital hospital = hospitalRepository.findByAdminUser(adminUser)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        return doctorRepository.findByHospital(hospital)
                .stream()
                .map(doctor -> mapToDoctorResponse("Doctor fetched successfully", doctor))
                .toList();
    }

    public DoctorResponse updateDoctorStatus(
            String doctorId,
            DoctorStatusRequest request
    ) {

        String adminEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User adminUser = userRepository.findByEmailAndRole(adminEmail, Role.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin account not found"));

        Hospital hospital = hospitalRepository.findByAdminUser(adminUser)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        Doctor doctor = doctorRepository.findByDoctorId(doctorId.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getHospital().getId().equals(hospital.getId())) {
            throw new RuntimeException("You cannot update another hospital doctor");
        }

        if (request.getStatus() == null) {
            throw new RuntimeException("Doctor status is required");
        }

        doctor.setStatus(request.getStatus());

        Doctor savedDoctor = doctorRepository.save(doctor);

        return mapToDoctorResponse(
                "Doctor status updated successfully",
                savedDoctor
        );
    }

    public DoctorResponse updateDoctorQueue(
            String doctorId,
            Map<String, Integer> request
    ) {

        String adminEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User adminUser = userRepository.findByEmailAndRole(adminEmail, Role.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Admin account not found"));

        Hospital hospital = hospitalRepository.findByAdminUser(adminUser)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        Doctor doctor = doctorRepository.findByDoctorId(doctorId.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getHospital().getId().equals(hospital.getId())) {
            throw new RuntimeException("You cannot update another hospital doctor queue");
        }

        if (request.get("queueCount") != null) {
            doctor.setQueueCount(request.get("queueCount"));
        }

        if (request.get("currentToken") != null) {
            doctor.setCurrentToken(request.get("currentToken"));
        }

        if (request.get("averageWaitingTime") != null) {
            doctor.setAverageWaitingTime(request.get("averageWaitingTime"));
        }

        Doctor savedDoctor = doctorRepository.save(doctor);

        return mapToDoctorResponse(
                "Doctor queue updated successfully",
                savedDoctor
        );
    }

    private void validateDoctorRequest(DoctorAddRequest request) {

        if (request.getDoctorName() == null || request.getDoctorName().trim().isEmpty()) {
            throw new RuntimeException("Doctor name is required");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Doctor email is required");
        }

        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Doctor phone number is required");
        }

        if (request.getSpecialization() == null || request.getSpecialization().trim().isEmpty()) {
            throw new RuntimeException("Doctor specialization is required");
        }

        if (request.getQualification() == null || request.getQualification().trim().isEmpty()) {
            throw new RuntimeException("Doctor qualification is required");
        }

        if (request.getExperience() == null || request.getExperience() < 0) {
            throw new RuntimeException("Doctor experience is required");
        }
    }

    private String generateDoctorId(Hospital hospital) {

        long count = doctorRepository.countByHospital(hospital) + 1;

        String doctorId = hospital.getHospitalCode() + "-DOC" + String.format("%04d", count);

        while (doctorRepository.existsByDoctorId(doctorId)) {
            count++;
            doctorId = hospital.getHospitalCode() + "-DOC" + String.format("%04d", count);
        }

        return doctorId;
    }

    private String generateTemporaryPassword() {

        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
        SecureRandom random = new SecureRandom();

        StringBuilder password = new StringBuilder("Dr@");

        for (int i = 0; i < 6; i++) {
            password.append(characters.charAt(random.nextInt(characters.length())));
        }

        return password.toString();
    }

    private DoctorResponse mapToDoctorResponse(String message, Doctor doctor) {

        User user = doctor.getUser();
        Hospital hospital = doctor.getHospital();

        return new DoctorResponse(
                message,
                doctor.getDoctorId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getExperience(),
                doctor.getStatus(),
                doctor.getQueueCount(),
                doctor.getCurrentToken(),
                doctor.getAverageWaitingTime(),
                hospital.getHospitalCode(),
                hospital.getHospitalName()
        );
    }
}