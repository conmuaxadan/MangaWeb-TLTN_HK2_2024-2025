package com.raindrop.notification_service.kafka;

import com.raindrop.common.event.ChapterNotificationEvent;
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
public class ChapterNotificationEventConsumer {
    EmailService emailService;

    @KafkaListener(topics = "manga-new-chapter-notification")
    public void consume(ChapterNotificationEvent event) {
        log.info("Received CHAPTER_NOTIFICATION event for user: {}, manga: {}, chapter: {}",
                event.getUserEmail(), event.getMangaTitle(), event.getChapterTitle());

        try {
            // Chuẩn bị nội dung email
            String emailContent = buildChapterNotificationEmailContent(event);

            // Tạo request gửi email
            SendEmailRequest request = SendEmailRequest.builder()
                    .to(Recipient.builder()
                            .name(event.getDisplayName())
                            .email(event.getUserEmail())
                            .build())
                    .subject("Chapter mới: " + event.getMangaTitle())
                    .htmlContent(emailContent)
                    .build();

            // Gửi email
            emailService.sendEmail(request);

            log.info("Successfully sent email notification to: {}", event.getUserEmail());
        } catch (Exception e) {
            log.error("Error sending email notification: {}", e.getMessage(), e);
        }
    }

    private String buildChapterNotificationEmailContent(ChapterNotificationEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;'>" +
                        "<div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>" +
                        "<div style='text-align: center; margin-bottom: 30px;'>" +
                        "<h1 style='color: #5dade2; margin: 0; font-size: 28px;'>🌧️ Raindrop Manga</h1>" +
                        "<div style='width: 50px; height: 3px; background-color: #5dade2; margin: 10px auto;'></div>" +
                        "</div>" +
                        "<h2 style='color: #333; text-align: center; margin-bottom: 20px;'>📚 Chapter mới đã được thêm!</h2>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Tin tuyệt vời!</p>" +
                        "<p style='font-size: 16px; line-height: 1.6; color: #555;'>Chapter mới đã được thêm vào truyện bạn đang theo dõi tại <strong>Raindrop Manga</strong>!</p>" +
                        "<div style='background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;'>" +
                        "<h4 style='color: #2e7d32; margin: 0 0 15px 0;'>📖 Thông tin chapter:</h4>" +
                        "<p style='color: #2e7d32; margin: 5px 0; font-size: 16px;'><strong>Truyện:</strong> %s</p>" +
                        "<p style='color: #2e7d32; margin: 5px 0; font-size: 16px;'><strong>Chapter %.1f:</strong> %s</p>" +
                        "<div style='text-align: center; margin-top: 15px;'>" +
                        "<a href='http://localhost:5713/mangas/%s/chapters/%s' style='background-color: #4CAF50; color: white; padding: 10px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;'>Đọc ngay 📖</a>" +
                        "</div>" +
                        "</div>" +
                        "<p style='color: #555; font-size: 16px; line-height: 1.6;'>Chúc bạn đọc truyện vui vẻ và có những trải nghiệm thú vị!</p>" +
                        "<hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>" +
                        "<p style='color: #666; font-size: 0.9em; text-align: center;'>Trân trọng,<br><strong>Đội ngũ Raindrop Manga</strong></p>" +
                        "</div>" +
                        "</div>",
                event.getMangaTitle(),
                event.getChapterNumber(),
                event.getChapterTitle(),
                event.getMangaId(),
                event.getChapterId()
        );
    }
}
