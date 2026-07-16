package com.medilink.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorAddRequest {

    private String doctorName;
    private String email;
    private String phone;
    private String specialization;
    private String qualification;
    private Integer experience;
}