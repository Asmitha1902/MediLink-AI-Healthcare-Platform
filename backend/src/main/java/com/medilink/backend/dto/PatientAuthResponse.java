package com.medilink.backend.dto;

import com.medilink.backend.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PatientAuthResponse {

    private String message;
    private String token;
    private String patientId;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private boolean emailVerified;
}