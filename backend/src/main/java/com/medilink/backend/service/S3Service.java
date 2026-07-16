package com.medilink.backend.service;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
public class S3Service {

    @Value("${aws.access.key}")
    private String accessKey;

    @Value("${aws.secret.key}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    public Map<String, String> uploadFile(MultipartFile file, String folderName) {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            throw new RuntimeException("Invalid file name");
        }

        String cleanFileName = originalFileName.replaceAll("\\s+", "_");

        String s3Key = folderName + "/" + UUID.randomUUID() + "_" + cleanFileName;

        String contentType = file.getContentType();

        if (contentType == null || contentType.trim().isEmpty()) {
            contentType = "application/octet-stream";
        }

        try {
            S3Client s3Client = createS3Client();

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
        .bucket(bucketName)
        .key(s3Key)
        .contentType(contentType)
        .serverSideEncryption(ServerSideEncryption.AES256)
        .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

            Map<String, String> response = new HashMap<>();

            response.put("fileName", originalFileName);
            response.put("s3Key", s3Key);
            response.put("fileType", contentType);

            return response;

        } catch (IOException e) {
            throw new RuntimeException("Failed to read file");
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to AWS S3");
        }
    }

    public String generatePresignedUrl(String s3Key) {

        try {
            S3Presigner presigner = createS3Presigner();

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return presigner.presignGetObject(presignRequest)
                    .url()
                    .toString();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate report view URL");
        }
    }

    public String generateDownloadPresignedUrl(String s3Key, String fileName) {

        try {
            S3Presigner presigner = createS3Presigner();

            String safeFileName = "medical-report";

            if (fileName != null && !fileName.trim().isEmpty()) {
                safeFileName = fileName
                        .replace("\"", "")
                        .replace("\n", "")
                        .replace("\r", "");
            }

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .responseContentDisposition(
                            "attachment; filename=\"" + safeFileName + "\""
                    )
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return presigner.presignGetObject(presignRequest)
                    .url()
                    .toString();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate report download URL");
        }
    }

    private S3Client createS3Client() {

        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                accessKey,
                secretKey
        );

        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }

    private S3Presigner createS3Presigner() {

        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                accessKey,
                secretKey
        );

        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
}