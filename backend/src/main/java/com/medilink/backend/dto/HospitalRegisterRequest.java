package com.medilink.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HospitalRegisterRequest {

    private String hospitalName;
    private String email;
    private String phone;
    private String city;
    private String password;
}