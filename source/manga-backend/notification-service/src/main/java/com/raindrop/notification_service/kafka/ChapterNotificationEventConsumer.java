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

    @KafkaListener(topics = "chapter-notifications", groupId = "notification-service")
    public void consume(ChapterNotificationEvent event) {
        log.info("Received CHAPTER_NOTIFICATION event for user: {}, manga: {}, chapter: {}",
                event.getUserEmail(), event.getMangaTitle(), event.getChapterTitle());

        try {
            // Chuẩn bị nội dung email
            String emailContent = buildEmailContent(event);

            // Tạo request gửi email
            SendEmailRequest request = SendEmailRequest.builder()
                    .to(Recipient.builder()
                            .name("Manga Reader") // Tên mặc định cho người đọc
                            .email(event.getUserEmail())
                            .build())
                    .subject("Chapter mới: " + event.getMangaTitle() + " - Chapter " + event.getChapterNumber())
                    .htmlContent(emailContent)
                    .build();

            // Gửi email
            emailService.sendEmail(request);

            log.info("Successfully sent email notification to: {}", event.getUserEmail());
        } catch (Exception e) {
            log.error("Error sending email notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Tạo nội dung email HTML
     * @param event Thông tin sự kiện
     * @return Nội dung email dạng HTML
     */
    private String buildEmailContent(ChapterNotificationEvent event) {
        return String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                "<h2 style='color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;'>Chapter mới đã được thêm vào truyện bạn yêu thích!</h2>" +
                "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;'>" +
                "<p style='margin: 5px 0;'><strong>Truyện:</strong> %s</p>" +
                "<p style='margin: 5px 0;'><strong>Chapter %.1f:</strong> %s</p>" +
                "</div>" +
                "<p style='margin: 15px 0;'>" +
                "<a href='http://localhost:3000/mangas/%s/chapters/%s' " +
                "style='background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; " +
                "border-radius: 4px; display: inline-block;'>Đọc ngay</a>" +
                "</p>" +
                "<p style='color: #666; font-size: 0.9em; margin-top: 20px;'>Chúc bạn đọc truyện vui vẻ!</p>" +
                "<p style='color: #999; font-size: 0.8em;'>Nếu bạn không muốn nhận thông báo này nữa, " +
                "vui lòng truy cập <a href='http://localhost:3000/profile/settings'>cài đặt tài khoản</a> của bạn.</p>" +
                "</div>",
                event.getMangaTitle(),
                event.getChapterNumber(),
                event.getChapterTitle(),
                event.getMangaId(),
                event.getChapterId()
        );
    }
}
