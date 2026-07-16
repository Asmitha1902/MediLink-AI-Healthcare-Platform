package com.medilink.backend.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.medilink.backend.dto.AuthResponse;
import com.medilink.backend.dto.HospitalLoginRequest;
import com.medilink.backend.dto.HospitalRegisterRequest;
import com.medilink.backend.dto.OtpVerifyRequest;
import com.medilink.backend.dto.ResendOtpRequest;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.HospitalRepository;
import com.medilink.backend.repository.UserRepository;
import com.medilink.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HospitalAuthService {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    public AuthResponse registerHospital(HospitalRegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (!isValidEmail(email)) {
            throw new RuntimeException("Please enter a valid hospital email address");
        }

        User existingUser = userRepository.findByEmail(email).orElse(null);

        if (existingUser != null && existingUser.isEmailVerified()) {
            throw new RuntimeException("Email already registered");
        }

        if (existingUser != null && existingUser.getRole() != Role.ROLE_ADMIN) {
            throw new RuntimeException("Email already registered with another account");
        }

        String otp = generateOtp();

        User hospitalAdmin;

        if (existingUser != null) {
            hospitalAdmin = existingUser;
            hospitalAdmin.setFullName(request.getHospitalName());
            hospitalAdmin.setPhone(request.getPhone());
            hospitalAdmin.setPassword(passwordEncoder.encode(request.getPassword()));
            hospitalAdmin.setRole(Role.ROLE_ADMIN);
            hospitalAdmin.setEmailVerified(false);
            hospitalAdmin.setOtpCode(passwordEncoder.encode(otp));
            hospitalAdmin.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        } else {
            hospitalAdmin = User.builder()
                    .fullName(request.getHospitalName())
                    .email(email)
                    .phone(request.getPhone())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.ROLE_ADMIN)
                    .emailVerified(false)
                    .otpCode(passwordEncoder.encode(otp))
                    .otpExpiry(LocalDateTime.now().plusMinutes(5))
                    .build();
        }

        User savedUser = userRepository.save(hospitalAdmin);

        Hospital hospital = hospitalRepository.findByAdminUser(savedUser).orElse(null);

        if (hospital == null) {
            String hospitalCode = generateHospitalCode(request.getHospitalName(), savedUser.getId());

            hospital = Hospital.builder()
                    .hospitalName(request.getHospitalName())
                    .hospitalCode(hospitalCode)
                    .city(request.getCity())
                    .phone(request.getPhone())
                    .adminUser(savedUser)
                    .build();
        } else {
            hospital.setHospitalName(request.getHospitalName());
            hospital.setCity(request.getCity());
            hospital.setPhone(request.getPhone());
        }

        Hospital savedHospital = hospitalRepository.save(hospital);

        emailService.sendOtpEmail(savedUser.getEmail(), otp);

        return new AuthResponse(
                "Hospital registered successfully. OTP sent to email.",
                null,
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                savedUser.isEmailVerified(),
                savedHospital.getHospitalCode(),
                savedHospital.getHospitalName(),
                savedHospital.getCity()
        );
    }

    public AuthResponse verifyHospitalOtp(OtpVerifyRequest request) {

        User user = userRepository.findByEmailAndRole(
                        request.getEmail().trim().toLowerCase(),
                        Role.ROLE_ADMIN
                )
                .orElseThrow(() -> new RuntimeException("Hospital account not found"));

        verifyOtp(user, request.getOtp());

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);

        User savedUser = userRepository.save(user);

        Hospital hospital = hospitalRepository.findByAdminUser(savedUser)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        return new AuthResponse(
                "Hospital email verified successfully",
                null,
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                savedUser.isEmailVerified(),
                hospital.getHospitalCode(),
                hospital.getHospitalName(),
                hospital.getCity()
        );
    }

    public AuthResponse resendHospitalOtp(ResendOtpRequest request) {

        User user = userRepository.findByEmailAndRole(
                        request.getEmail().trim().toLowerCase(),
                        Role.ROLE_ADMIN
                )
                .orElseThrow(() -> new RuntimeException("Hospital account not found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email already verified");
        }

        String otp = generateOtp();

        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);

        Hospital hospital = hospitalRepository.findByAdminUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        return new AuthResponse(
                "OTP resent successfully",
                null,
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified(),
                hospital.getHospitalCode(),
                hospital.getHospitalName(),
                hospital.getCity()
        );
    }

    public AuthResponse loginHospital(HospitalLoginRequest request) {

        User hospitalAdmin = userRepository.findByEmailAndRole(
                        request.getEmail().trim().toLowerCase(),
                        Role.ROLE_ADMIN
                )
                .orElseThrow(() -> new RuntimeException("Invalid hospital email or password"));

        if (!hospitalAdmin.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before login");
        }

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                hospitalAdmin.getPassword()
        );

        if (!passwordMatches) {
            throw new RuntimeException("Invalid hospital email or password");
        }

        Hospital hospital = hospitalRepository.findByAdminUser(hospitalAdmin)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        String token = jwtService.generateToken(hospitalAdmin);

        return new AuthResponse(
                "Hospital login successful",
                token,
                hospitalAdmin.getFullName(),
                hospitalAdmin.getEmail(),
                hospitalAdmin.getPhone(),
                hospitalAdmin.getRole(),
                hospitalAdmin.isEmailVerified(),
                hospital.getHospitalCode(),
                hospital.getHospitalName(),
                hospital.getCity()
        );
    }

    private void verifyOtp(User user, String otp) {

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("OTP not found. Please request a new OTP.");
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP expired. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otp, user.getOtpCode())) {
            throw new RuntimeException("Invalid OTP");
        }
    }

    private String generateHospitalCode(String hospitalName, Long id) {

        String cleanName = hospitalName.replaceAll("[^A-Za-z]", "").toUpperCase();

        String prefix;

        if (cleanName.length() >= 4) {
            prefix = cleanName.substring(0, 4);
        } else {
            prefix = cleanName + "HOSP";
            prefix = prefix.substring(0, 4);
        }

        String hospitalCode = prefix + String.format("%03d", id);

        while (hospitalRepository.existsByHospitalCode(hospitalCode)) {
            id++;
            hospitalCode = prefix + String.format("%03d", id);
        }

        return hospitalCode;
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return email.matches(emailRegex);
    }
}