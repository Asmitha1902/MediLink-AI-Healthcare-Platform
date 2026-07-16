package com.medilink.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.User;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByDoctorId(String doctorId);

    Optional<Doctor> findByUser(User user);

    List<Doctor> findByHospital(Hospital hospital);

    long countByHospital(Hospital hospital);

    boolean existsByDoctorId(String doctorId);
    Optional<Doctor> findByUser_Email(String email);
}