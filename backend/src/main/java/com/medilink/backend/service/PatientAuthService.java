package com.medilink.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medilink.backend.dto.OtpVerifyRequest;
import com.medilink.backend.dto.PatientAuthResponse;
import com.medilink.backend.dto.PatientLoginRequest;
import com.medilink.backend.dto.PatientRegisterRequest;
import com.medilink.backend.dto.ResendOtpRequest;
import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.Role;
import com.medilink.backend.entity.User;
import com.medilink.backend.repository.PatientRepository;
import com.medilink.backend.repository.UserRepository;
import com.medilink.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientAuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Transactional(rollbackFor = Exception.class)
    public PatientAuthResponse registerPatient(PatientRegisterRequest request) {

        validateRegisterRequest(request);

        String patientEmail = request.getEmail().trim().toLowerCase();
        String placeName = request.getPlaceName() == null
                ? ""
                : request.getPlaceName().trim();

        Optional<User> existingPatientUserOptional =
                userRepository.findByEmailAndRole(patientEmail, Role.ROLE_PATIENT);

        if (existingPatientUserOptional.isPresent()) {

            User existingUser = existingPatientUserOptional.get();

            if (existingUser.isEmailVerified()) {
                throw new RuntimeException("Patient already registered with this email");
            }

            String otp = generateOtp();

            existingUser.setFullName(request.getFullName().trim());
            existingUser.setPhone(request.getPhone().trim());
            existingUser.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            existingUser.setOtpCode(passwordEncoder.encode(otp));
            existingUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

            User savedUser = userRepository.save(existingUser);

            Patient patient = patientRepository.findByUser(savedUser)
                    .orElseGet(() -> {
                        String patientId = generateUniquePatientId(savedUser.getId());

                        Patient newPatient = Patient.builder()
                                .patientId(patientId)
                                .placeName(placeName)
                                .user(savedUser)
                                .build();

                        return patientRepository.save(newPatient);
                    });

            patient.setPlaceName(placeName);

            Patient savedPatient = patientRepository.save(patient);

            sendOtpSafely(savedUser.getEmail(), otp);

            return buildPatientResponse(
                    "OTP sent successfully. Please verify your email.",
                    null,
                    savedPatient,
                    savedUser
            );
        }

        if (userRepository.existsByEmail(patientEmail)) {
            throw new RuntimeException("This email is already used by another account");
        }

        String otp = generateOtp();

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(patientEmail)
                .password(passwordEncoder.encode(request.getPassword().trim()))
                .role(Role.ROLE_PATIENT)
                .emailVerified(false)
                .otpCode(passwordEncoder.encode(otp))
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .build();

        User savedUser = userRepository.save(user);

        String patientId = generateUniquePatientId(savedUser.getId());

        Patient patient = Patient.builder()
                .patientId(patientId)
                .placeName(placeName)
                .user(savedUser)
                .build();

        Patient savedPatient = patientRepository.save(patient);

        sendOtpSafely(savedUser.getEmail(), otp);

        return buildPatientResponse(
                "Patient registered successfully. OTP sent to email.",
                null,
                savedPatient,
                savedUser
        );
    }

    @Transactional
    public PatientAuthResponse verifyPatientOtp(OtpVerifyRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailAndRole(email, Role.ROLE_PATIENT)
                .orElseThrow(() -> new RuntimeException("Patient account not found"));

        verifyOtp(user, request.getOtp().trim());

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);

        User savedUser = userRepository.save(user);

        Patient patient = patientRepository.findByUser(savedUser)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        return buildPatientResponse(
                "Patient email verified successfully",
                null,
                patient,
                savedUser
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public PatientAuthResponse resendPatientOtp(ResendOtpRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailAndRole(email, Role.ROLE_PATIENT)
                .orElseThrow(() -> new RuntimeException("Patient account not found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email already verified");
        }

        String otp = generateOtp();

        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        User savedUser = userRepository.save(user);

        Patient patient = patientRepository.findByUser(savedUser)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        sendOtpSafely(savedUser.getEmail(), otp);

        return buildPatientResponse(
                "OTP resent successfully",
                null,
                patient,
                savedUser
        );
    }

    public PatientAuthResponse loginPatient(PatientLoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword().trim();

        User user = userRepository.findByEmailAndRole(email, Role.ROLE_PATIENT)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before login");
        }

        boolean passwordMatches = passwordEncoder.matches(
                password,
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new RuntimeException("Invalid email or password");
        }

        Patient patient = patientRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        String token = jwtService.generateToken(user);

        return buildPatientResponse(
                "Patient login successful",
                token,
                patient,
                user
        );
    }

    private void sendOtpSafely(String email, String otp) {

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            throw new RuntimeException(
                    "OTP email failed. Account was not created. Please try again."
            );
        }
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

    private PatientAuthResponse buildPatientResponse(
            String message,
            String token,
            Patient patient,
            User user
    ) {
        return new PatientAuthResponse(
                message,
                token,
                patient.getPatientId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified()
        );
    }

    private void validateRegisterRequest(PatientRegisterRequest request) {

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new RuntimeException("Full name is required");
        }

        if (!isValidEmail(request.getEmail())) {
            throw new RuntimeException("Please enter a valid email address");
        }

        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }

        if (request.getPassword() == null || request.getPassword().trim().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
    }

    private String generateUniquePatientId(Long userId) {

        String patientId = "PAT" + String.format("%06d", userId);

        while (patientRepository.existsByPatientId(patientId)) {
            userId++;
            patientId = "PAT" + String.format("%06d", userId);
        }

        return patientId;
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    private boolean isValidEmail(String email) {

        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";

        return email.trim().matches(emailRegex);
    }
}