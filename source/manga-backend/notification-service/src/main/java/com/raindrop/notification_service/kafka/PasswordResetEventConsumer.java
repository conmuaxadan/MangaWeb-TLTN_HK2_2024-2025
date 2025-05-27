package com.raindrop.notification_service.kafka;

import com.raindrop.common.event.PasswordResetEvent;
import com.raindrop.notification_service.dto.request.Recipient;
import com.raindrop.notification_service.dto.request.SendEmailRequest;
import com.raindrop.notification_service.service.EmailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PasswordResetEventConsumer {
    EmailService emailService;

    @KafkaListener(topics = "password-reset")
    public void consume(PasswordResetEvent event) {
        log.info("Received PASSWORD_RESET event for user: {}", event.getEmail());

        try {
            // Chuẩn bị nội dung email
            String emailContent = buildPasswordResetEmailContent(event);

            // Tạo request gửi email
            SendEmailRequest request = SendEmailRequest.builder()
                    .to(Recipient.builder()
                            .name(event.getDisplayName())
                            .email(event.getEmail())
                            .build())
                    .subject("Mã xác nhận đặt lại mật khẩu")
                    .htmlContent(emailContent)
                    .build();

            // Gửi email
            emailService.sendEmail(request);

            log.info("Successfully sent password reset email to: {}", event.getEmail());
        } catch (Exception e) {
            log.error("Error sending password reset email: {}", e.getMessage(), e);
        }
    }

    private String buildPasswordResetEmailContent(PasswordResetEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;'>" +
                        "<div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>" +
                        "<div style='text-align: center; margin-bottom: 30px;'>" +
                        "<h1 style='color: #5dade2; margin: 0; font-size: 28px;'>🌧️ Raindrop Manga</h1>" +
                        "<div style='width: 50px; height: 3px; background-color: #5dade2; margin: 10px auto;'></div>" +
                        "</div>" +
                        "<h2 style='color: #333; text-align: center; margin-bottom: 20px;'>🔐 Đặt lại mật khẩu</h2>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Xin chào <strong>%s</strong>,</p>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình tại <strong>Raindrop Manga</strong>.</p>" +
                        "<div style='background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 5px;'>" +
                        "<h4 style='color: #1976d2; margin: 0 0 10px 0;'>🔑 Mã xác nhận của bạn:</h4>" +
                        "<div style='text-align: center; margin: 15px 0;'>" +
                        "<span style='background-color: #2196f3; color: white; padding: 15px 25px; font-size: 24px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 2px;'>%s</span>" +
                        "</div>" +
                        "<p style='color: #1976d2; margin: 0; font-size: 14px; text-align: center;'>⏰ Mã này sẽ hết hạn sau 1 phút.</p>" +
                        "</div>" +
                        "<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px;'>" +
                        "<h4 style='color: #856404; margin: 0 0 10px 0;'>⚠️ Lưu ý bảo mật:</h4>" +
                        "<p style='color: #856404; margin: 0; font-size: 16px; line-height: 1.6;'>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ với chúng tôi nếu có nghi ngờ.</p>" +
                        "</div>" +
                        "<p style='color: #555; font-size: 16px; line-height: 1.6;'>Chúng tôi luôn đặt bảo mật tài khoản của bạn lên hàng đầu.</p>" +
                        "<hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>" +
                        "<p style='color: #666; font-size: 0.9em; text-align: center;'>Trân trọng,<br><strong>Đội ngũ Raindrop Manga</strong></p>" +
                        "</div>" +
                        "</div>",
                event.getDisplayName(),
                event.getResetCode()
        );
    }
}
