package com.raindrop.notification_service.kafka;

import com.raindrop.common.event.UserEvent;
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
public class UserEventConsumer {
    EmailService emailService;

    @KafkaListener(topics = "onboard-successful")
    public void consumeUserProfileEvent(UserEvent message) {
        String emailContent = String.format(buildWelcomeEmailContent(message));
        SendEmailRequest request = SendEmailRequest.builder()
                .to(Recipient.builder()
                        .name(message.getDisplayName())
                        .email(message.getEmail())
                        .build())
                .subject("Welcome to Raindrop Manga")
                .htmlContent(emailContent)
                .build();
                
        emailService.sendEmail(request);
        log.info("Welcome email sent to: {}", message.getEmail());
    }

    private String buildWelcomeEmailContent(UserEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;'>" +
                        "<div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>" +
                        "<div style='text-align: center; margin-bottom: 30px;'>" +
                        "<h1 style='color: #5dade2; margin: 0; font-size: 28px;'>🌧️ Raindrop Manga</h1>" +
                        "<div style='width: 50px; height: 3px; background-color: #5dade2; margin: 10px auto;'></div>" +
                        "</div>" +
                        "<h2 style='color: #333; text-align: center; margin-bottom: 20px;'>🎉 Chào mừng bạn đến với cộng đồng!</h2>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Xin chào <strong>%s</strong>,</p>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Chúc mừng bạn đã tham gia thành công vào <strong>Raindrop Manga</strong></p>" +
                        "<div style='background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;'>" +
                        "<h4 style='color: #2e7d32; margin: 0 0 15px 0;'>🎉 Bạn đã sẵn sàng khám phá!</h4>" +
                        "<p style='color: #2e7d32; margin: 0; line-height: 1.6;'>Hãy bắt đầu hành trình khám phá thế giới manga đầy màu sắc cùng chúng tôi.</p>" +
                        "<div style='text-align: center; margin-top: 15px;'>" +
                        "<a href='#' style='background-color: #4CAF50; color: white; padding: 10px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;'>Bắt đầu đọc ngay! 📖</a>" +
                        "</div>" +
                        "</div>" +
                        "<p style='color: #555; font-size: 16px; line-height: 1.6;'>Chúng tôi hy vọng bạn sẽ có những trải nghiệm tuyệt vời tại Raindrop Manga!</p>" +
                        "<hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>" +
                        "<p style='color: #666; font-size: 0.9em; text-align: center;'>Trân trọng,<br><strong>Đội ngũ Raindrop Manga</strong></p>" +
                        "</div>" +
                        "</div>",
                event.getDisplayName()
        );
    }
}
