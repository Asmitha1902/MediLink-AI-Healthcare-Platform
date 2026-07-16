package com.medilink.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorLoginRequest {

    private String identifier; // doctorId or email
    private String password;
}