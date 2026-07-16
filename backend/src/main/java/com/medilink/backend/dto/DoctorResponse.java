package com.medilink.backend.dto;

import com.medilink.backend.entity.DoctorStatus;
import com.medilink.backend.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DoctorResponse {

    private String message;

    private String doctorId;
    private String fullName;
    private String email;
    private String phone;
    private Role role;

    private String specialization;
    private String qualification;
    private Integer experience;
    private DoctorStatus status;

    private int queueCount;
    private int currentToken;
    private int averageWaitingTime;

    private String hospitalCode;
    private String hospitalName;
}