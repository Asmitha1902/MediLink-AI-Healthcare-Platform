package com.medilink.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.AccessRequestStatus;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.DoctorAccessRequest;
import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.SharedAccess;

public interface DoctorAccessRequestRepository extends JpaRepository<DoctorAccessRequest, Long> {

    Optional<DoctorAccessRequest> findBySharedAccessAndDoctor(
            SharedAccess sharedAccess,
            Doctor doctor
    );
Optional<DoctorAccessRequest> findByEmailActionToken(String emailActionToken);
    Optional<DoctorAccessRequest> findBySharedAccessAndDoctorAndStatus(
            SharedAccess sharedAccess,
            Doctor doctor,
            AccessRequestStatus status
    );

    List<DoctorAccessRequest> findBySharedAccessPatientOrderByRequestedAtDesc(
            Patient patient
    );

    List<DoctorAccessRequest> findByDoctorOrderByRequestedAtDesc(
            Doctor doctor
    );
}
