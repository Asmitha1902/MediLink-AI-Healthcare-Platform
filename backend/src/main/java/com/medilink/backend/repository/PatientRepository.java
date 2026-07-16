package com.medilink.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.User;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUser(User user);

    Optional<Patient> findByPatientId(String patientId);

    boolean existsByPatientId(String patientId);
    Optional<Patient> findByUser_Email(String email);
}