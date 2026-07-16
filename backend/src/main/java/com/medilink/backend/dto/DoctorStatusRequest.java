package com.medilink.backend.dto;

import com.medilink.backend.entity.DoctorStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorStatusRequest {
    private DoctorStatus status;
}