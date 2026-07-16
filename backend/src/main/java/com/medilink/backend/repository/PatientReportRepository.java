package com.medilink.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Patient;
import com.medilink.backend.entity.PatientReport;

public interface PatientReportRepository extends JpaRepository<PatientReport, Long> {

    List<PatientReport> findByPatientOrderByUploadedAtDesc(Patient patient);

    long countByPatient(Patient patient);
}