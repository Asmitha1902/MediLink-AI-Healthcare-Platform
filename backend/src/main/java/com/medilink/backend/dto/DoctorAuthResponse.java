package com.medilink.backend.dto;

import com.medilink.backend.entity.DoctorStatus;
import com.medilink.backend.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DoctorAuthResponse {

    private String message;
    private String token;

    private String doctorId;
    private String fullName;
    private String email;
    private String phone;
    private Role role;

    private String specialization;
    private String qualification;
    private Integer experience;
    private DoctorStatus status;

    private String hospitalCode;
    private String hospitalName;
}