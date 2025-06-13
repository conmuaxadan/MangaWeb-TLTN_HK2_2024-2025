package com.raindrop.notification_service.kafka;

import com.raindrop.common.event.BlockUserEvent;
import com.raindrop.notification_service.dto.request.Recipient;
import com.raindrop.notification_service.dto.request.SendEmailRequest;
import com.raindrop.notification_service.service.EmailService;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserBlockEventConsumer {
    EmailService emailService;

    @KafkaListener(topics = "block-user")
    public void consumeUserBlockEvent(BlockUserEvent message) {
        try {
            String emailContent = buildBlockNotificationEmailContent(message);

            SendEmailRequest request = SendEmailRequest.builder()
                    .to(Recipient.builder()
                            .name(message.getDisplayName())
                            .email(message.getEmail())
                            .build())
                    .subject("Thông báo khóa tài khoản - Raindrop Manga")
                    .htmlContent(emailContent)
                    .build();

            emailService.sendEmail(request);
            log.info("Block notification email sent to: {}", message.getEmail());
        } catch (Exception e) {
            log.error("Error sending block notification email: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "unblock-user")
    public void consumeUserUnblockEvent(BlockUserEvent message) {
        try {
            String emailContent = buildUnblockNotificationEmailContent(message);

            SendEmailRequest request = SendEmailRequest.builder()
                    .to(Recipient.builder()
                            .name(message.getDisplayName())
                            .email(message.getEmail())
                            .build())
                    .subject("Thông báo mở khóa tài khoản - Raindrop Manga")
                    .htmlContent(emailContent)
                    .build();

            emailService.sendEmail(request);
            log.info("Unblock notification email sent to: {}", message.getEmail());
        } catch (Exception e) {
            log.error("Error sending unblock notification email: {}", e.getMessage(), e);
        }
    }

    private String buildBlockNotificationEmailContent(BlockUserEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;'>" +
                        "<div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>" +
                        "<div style='text-align: center; margin-bottom: 30px;'>" +
                        "<h1 style='color: #5dade2; margin: 0; font-size: 28px;'>🌧️ Raindrop Manga</h1>" +
                        "<div style='width: 50px; height: 3px; background-color: #5dade2; margin: 10px auto;'></div>" +
                        "</div>" +
                        "<h2 style='color: #333; text-align: center; margin-bottom: 20px;'>⚠️ Thông báo khóa tài khoản</h2>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Xin chào <strong>%s</strong>,</p>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Chúng tôi phải thông báo rằng tài khoản của bạn tại <strong>Raindrop Manga</strong> đã bị khóa.</p>" +
                        "<div style='background-color: #ffe6e6; border-left: 4px solid #ff6b6b; padding: 20px; margin: 20px 0; border-radius: 5px;'>" +
                        "<h4 style='color: #d32f2f; margin: 0 0 10px 0;'>📋 Lý do khóa tài khoản:</h4>" +
                        "<p style='color: #d32f2f; margin: 0; font-size: 16px; font-weight: 500;'>%s</p>" +
                        "</div>" +
                        "<div style='background-color: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0;'>" +
                        "<h4 style='color: #2e7d32; margin: 0 0 15px 0;'>🔄 Muốn khôi phục tài khoản?</h4>" +
                        "<p style='color: #2e7d32; margin: 0; line-height: 1.6;'>Nếu bạn cho rằng đây là một sự nhầm lẫn hoặc muốn khiếu nại, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>" +
                        "<div style='text-align: center; margin-top: 15px;'>" +
                        "<a href='mailto:support@raindropmanga.com' style='background-color: #4CAF50; color: white; padding: 10px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;'>Liên hệ hỗ trợ</a>" +
                        "</div>" +
                        "</div>" +
                        "<p style='color: #555; font-size: 16px; line-height: 1.6;'>Chúng tôi rất tiếc về sự bất tiện này và hy vọng sẽ sớm giải quyết vấn đề.</p>" +
                        "<hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>" +
                        "<p style='color: #666; font-size: 0.9em; text-align: center;'>Trân trọng,<br><strong>Đội ngũ Raindrop Manga</strong></p>" +
                        "</div>" +
                        "</div>",
                event.getDisplayName(),
                event.getReason() != null ? event.getReason() : "Không được cung cấp"
        );
    }

    private String buildUnblockNotificationEmailContent(BlockUserEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;'>" +
                        "<div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>" +
                        "<div style='text-align: center; margin-bottom: 30px;'>" +
                        "<h1 style='color: #5dade2; margin: 0; font-size: 28px;'>🌧️ Raindrop Manga</h1>" +
                        "<div style='width: 50px; height: 3px; background-color: #5dade2; margin: 10px auto;'></div>" +
                        "</div>" +
                        "<h2 style='color: #333; text-align: center; margin-bottom: 20px;'>🎉 Tài khoản đã được khôi phục!</h2>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Xin chào <strong>%s</strong>,</p>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Chúng tôi vui mừng thông báo rằng tài khoản của bạn tại <strong>Raindrop Manga</strong> đã được mở khóa thành công!</p>" +
                        "<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px;'>" +
                        "<h4 style='color: #856404; margin: 0 0 10px 0;'>⚠️ Lưu ý quan trọng:</h4>" +
                        "<p style='color: #856404; margin: 0; font-size: 16px; line-height: 1.6;'>Để tránh những vấn đề tương tự trong tương lai, vui lòng tuân thủ các quy định và điều khoản sử dụng của Raindrop Manga.</p>" +
                        "</div>" +
                        "<p style='color: #555; font-size: 16px; line-height: 1.6;'>Cảm ơn bạn đã kiên nhẫn và chúng tôi hy vọng bạn sẽ có những trải nghiệm tuyệt vời tại Raindrop Manga!</p>" +
                        "<hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>" +
                        "<p style='color: #666; font-size: 0.9em; text-align: center;'>Trân trọng,<br><strong>Đội ngũ Raindrop Manga</strong></p>" +
                        "</div>" +
                        "</div>",
                event.getDisplayName()
        );
    }
}
