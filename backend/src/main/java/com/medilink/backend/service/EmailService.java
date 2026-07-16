package com.medilink.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    private static final String FROM_EMAIL = "medicare202627@gmail.com";

    public void sendOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(FROM_EMAIL);
        message.setTo(toEmail);
        message.setSubject("MediLink AI - Email Verification OTP");

        message.setText(
                "Hello,\n\n" +
                        "Your MediLink AI verification OTP is: " + otp + "\n\n" +
                        "This OTP is valid for 5 minutes.\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "Regards,\n" +
                        "MediLink AI Team"
        );

        javaMailSender.send(message);
    }

    public void sendDoctorCredentials(
            String toEmail,
            String doctorName,
            String doctorId,
            String temporaryPassword,
            String hospitalName
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(FROM_EMAIL);
        message.setTo(toEmail);
        message.setSubject("MediLink AI - Doctor Account Credentials");

        message.setText(
                "Hello " + safeText(doctorName) + ",\n\n" +
                        "Your doctor account has been created by " + safeText(hospitalName) + ".\n\n" +
                        "Doctor ID: " + safeText(doctorId) + "\n" +
                        "Temporary Password: " + temporaryPassword + "\n\n" +
                        "Please login using your Doctor ID or email and change your password after login.\n\n" +
                        "Regards,\n" +
                        "MediLink AI Team"
        );

        javaMailSender.send(message);
    }

    public void sendDoctorAccessRequestEmail(
            String patientEmail,
            String patientName,
            String doctorName,
            String doctorId,
            String specialization,
            String hospitalName,
            int selectedReportsCount,
            String accessRequestsLink
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(FROM_EMAIL);
        message.setTo(patientEmail);
        message.setSubject("MediLink AI - New Doctor Access Request");

        message.setText(
                "Hello " + safeText(patientName) + ",\n\n" +
                        "A doctor has requested access to your selected medical reports.\n\n" +
                        "Doctor Details:\n" +
                        "Doctor Name: " + safeText(doctorName) + "\n" +
                        "Doctor ID: " + safeText(doctorId) + "\n" +
                        "Specialization: " + safeText(specialization) + "\n" +
                        "Hospital: " + safeText(hospitalName) + "\n" +
                        "Selected Reports: " + selectedReportsCount + "\n\n" +
                        "Please login to MediLink AI and approve or reject this request.\n\n" +
                        "Access Requests Page:\n" +
                        accessRequestsLink + "\n\n" +
                        "Note: Your reports will be shared only after your approval.\n\n" +
                        "Regards,\n" +
                        "MediLink AI Team"
        );

        javaMailSender.send(message);
    }

    public void sendDoctorAccessRequestActionEmail(
            String patientEmail,
            String patientName,
            String doctorName,
            String doctorId,
            String specialization,
            String hospitalName,
            int selectedReportsCount,
            String approveLink,
            String rejectLink
    ) {

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    true,
                    "UTF-8"
            );

            helper.setFrom(FROM_EMAIL);
            helper.setTo(patientEmail);
            helper.setSubject("MediLink AI - New Doctor Access Request");

            String html =
                    "<div style='font-family:Arial,sans-serif;background:#f8fafc;padding:24px;'>" +
                            "<div style='max-width:640px;margin:auto;background:#ffffff;border-radius:18px;padding:26px;border:1px solid #d1fae5;'>" +

                            "<h2 style='color:#064e3b;margin:0 0 10px 0;'>MediLink AI</h2>" +

                            "<p style='color:#334155;font-size:15px;'>Hello <b>" + safeHtml(patientName) + "</b>,</p>" +

                            "<p style='color:#334155;font-size:15px;line-height:1.6;'>" +
                            "A doctor has requested access to your selected medical reports." +
                            "</p>" +

                            "<div style='background:#ecfdf5;border-radius:14px;padding:18px;margin:18px 0;color:#064e3b;'>" +
                            "<p><b>Doctor Name:</b> " + safeHtml(doctorName) + "</p>" +
                            "<p><b>Doctor ID:</b> " + safeHtml(doctorId) + "</p>" +
                            "<p><b>Specialization:</b> " + safeHtml(specialization) + "</p>" +
                            "<p><b>Hospital:</b> " + safeHtml(hospitalName) + "</p>" +
                            "<p><b>Selected Reports:</b> " + selectedReportsCount + "</p>" +
                            "</div>" +

                            "<p style='color:#334155;font-size:15px;line-height:1.6;'>" +
                            "Please approve or reject this request. Reports will be shared only after your approval." +
                            "</p>" +

                            "<div style='margin-top:24px;margin-bottom:20px;'>" +
                            "<a href='" + approveLink + "' " +
                            "style='background:#047857;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:bold;display:inline-block;margin-right:12px;'>" +
                            "Approve" +
                            "</a>" +

                            "<a href='" + rejectLink + "' " +
                            "style='background:#dc2626;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:bold;display:inline-block;'>" +
                            "Reject" +
                            "</a>" +
                            "</div>" +

                            "<p style='color:#64748b;font-size:13px;line-height:1.5;'>" +
                            "If the buttons do not work, please login to MediLink AI and open Access Requests page." +
                            "</p>" +

                            "<p style='color:#64748b;font-size:13px;margin-top:22px;'>" +
                            "Regards,<br/>MediLink AI Team" +
                            "</p>" +

                            "</div>" +
                            "</div>";

            helper.setText(html, true);

            javaMailSender.send(mimeMessage);

        } catch (Exception e) {
            System.out.println("Failed to send doctor access request action email: " + e.getMessage());
        }
    }

    private String safeText(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "Not Available";
        }

        return value;
    }

    private String safeHtml(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "Not Available";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}