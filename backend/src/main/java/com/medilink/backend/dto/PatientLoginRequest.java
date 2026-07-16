package com.medilink.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatientLoginRequest {

    private String email;
    private String password;
}