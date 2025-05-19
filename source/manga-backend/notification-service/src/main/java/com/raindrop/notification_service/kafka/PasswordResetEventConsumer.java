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

    @KafkaListener(topics = "password-reset", groupId = "notification-service")
    public void consume(PasswordResetEvent event) {
        log.info("Received PASSWORD_RESET event for user: {}", event.getEmail());

        try {
            // Chuẩn bị nội dung email
            String emailContent = buildEmailContent(event);

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

    /**
     * Tạo nội dung email HTML
     * @param event Thông tin sự kiện
     * @return Nội dung email dạng HTML
     */
    private String buildEmailContent(PasswordResetEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                "<h2 style='color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;'>Đặt lại mật khẩu</h2>" +
                "<p>Xin chào %s,</p>" +
                "<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>" +
                "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;'>" +
                "<p style='margin: 5px 0;'>Mã xác nhận của bạn là:</p>" +
                "<h1 style='margin: 10px 0; color: #4CAF50;'>%s</h1>" +
                "<p style='margin: 5px 0; font-size: 0.9em;'>Mã này sẽ hết hạn sau 1 phút.</p>" +
                "</div>" +
                "<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>" +
                "<p style='color: #666; font-size: 0.9em; margin-top: 20px;'>Trân trọng,<br>Đội ngũ Raindrop Manga</p>" +
                "</div>",
                event.getDisplayName(),
                event.getResetCode()
        );
    }
}
