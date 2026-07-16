package com.medilink.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.HospitalResource;

public interface HospitalResourceRepository extends JpaRepository<HospitalResource, Long> {

    Optional<HospitalResource> findByHospital(Hospital hospital);
}