package com.medilink.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.User;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    Optional<Hospital> findByAdminUser(User adminUser);

    Optional<Hospital> findByHospitalCode(String hospitalCode);

    boolean existsByHospitalCode(String hospitalCode);
    Optional<Hospital> findByAdminUser_Email(String email);
}