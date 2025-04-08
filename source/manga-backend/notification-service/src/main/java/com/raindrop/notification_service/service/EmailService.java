package com.raindrop.notification_service.service;

import com.raindrop.notification_service.dto.request.EmailRequest;
import com.raindrop.notification_service.dto.request.SendEmailRequest;
import com.raindrop.notification_service.dto.request.Sender;
import com.raindrop.notification_service.dto.response.EmailResponse;
import com.raindrop.notification_service.repository.httpclient.EmailClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailService {
    EmailClient emailClient;
    @org.springframework.beans.factory.annotation.Value("${app.email.api-key}")
    String apiKey;


    public EmailResponse sendEmail(SendEmailRequest request) {
        EmailRequest emailRequest = EmailRequest.builder()
                .sender(Sender.builder()
                        .name("Raindrop DotCom")
                        .email("jotaro903@gmail.com")
                        .build())
                .to(List.of(request.getTo()))
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .build();
        try {
           return emailClient.sendEmail(apiKey, emailRequest);
        } catch (FeignException.FeignClientException e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }

}
