package com.raindrop.notification_service.service;

import com.raindrop.notification_service.dto.request.EmailRequest;
import com.raindrop.notification_service.dto.request.SendEmailRequest;
import com.raindrop.notification_service.dto.request.Sender;
import com.raindrop.notification_service.dto.response.EmailResponse;
import com.raindrop.notification_service.exception.AppException;
import com.raindrop.notification_service.exception.ErrorCode;
import com.raindrop.notification_service.repository.httpclient.EmailClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailService {
    EmailClient emailClient;


    @Value("${app.email.api-key}")
    @NonFinal
    String apiKey;

    public EmailResponse sendEmail(SendEmailRequest request) {
        log.info("Sending email to: {}", request.getTo().getEmail());

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("API key is not configured properly");
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
        EmailRequest emailRequest = EmailRequest.builder()
                .sender(Sender.builder()
                        .name("Raindrop DotCom")
                        .email("jotaro903@gmail.com")
                        .build())
                .to(List.of(request.getTo()))
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .build();

        log.debug("Sending email request: {}", emailRequest);
        try {
            return emailClient.sendEmail(apiKey, emailRequest);
        } catch (FeignException.Unauthorized e) {
            log.error("Authentication failed with Brevo API. Please check your API key.", e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        } catch (FeignException e) {
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }

}
