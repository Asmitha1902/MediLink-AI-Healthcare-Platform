package com.medilink.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shared_access")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String accessToken;

    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;

    private boolean active;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @OneToMany(mappedBy = "sharedAccess", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SharedAccessReport> sharedReports = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.active = true;
    }
}