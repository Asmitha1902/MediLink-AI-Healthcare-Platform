package com.medilink.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.SharedAccess;

public interface SharedAccessRepository extends JpaRepository<SharedAccess, Long> {

    Optional<SharedAccess> findByAccessToken(String accessToken);

    List<SharedAccess> findByPatientOrderByCreatedAtDesc(Patient patient);
}