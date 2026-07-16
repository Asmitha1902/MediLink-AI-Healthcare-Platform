package com.medilink.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medilink.backend.entity.SharedAccess;
import com.medilink.backend.entity.SharedAccessReport;

public interface SharedAccessReportRepository extends JpaRepository<SharedAccessReport, Long> {

    List<SharedAccessReport> findBySharedAccess(SharedAccess sharedAccess);
}