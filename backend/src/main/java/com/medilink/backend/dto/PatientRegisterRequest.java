package com.medilink.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatientRegisterRequest {

    private String fullName;
    private String phone;
    private String email;
    private String placeName;
    private String password;
}