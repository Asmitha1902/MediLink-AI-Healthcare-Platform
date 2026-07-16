package com.medilink.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.Appointment;
import com.medilink.backend.entity.AppointmentStatus;
import com.medilink.backend.entity.Doctor;
import com.medilink.backend.entity.Hospital;
import com.medilink.backend.entity.Patient;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientOrderByRequestedAtDesc(Patient patient);

    List<Appointment> findByHospitalOrderByRequestedAtDesc(Hospital hospital);

    List<Appointment> findByHospitalAndStatusOrderByRequestedAtDesc(
            Hospital hospital,
            AppointmentStatus status
    );

    List<Appointment> findByDoctorAndStatusOrderByAppointmentDateAscAppointmentTimeAsc(
            Doctor doctor,
            AppointmentStatus status
    );

    List<Appointment> findByDoctorOrderByAppointmentDateAscAppointmentTimeAsc(Doctor doctor);
}