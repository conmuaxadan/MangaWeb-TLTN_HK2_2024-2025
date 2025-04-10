package com.raindrop.notification_service.controller;

import com.raindrop.notification_service.dto.request.SendEmailRequest;
import com.raindrop.notification_service.dto.response.ApiResponse;
import com.raindrop.notification_service.dto.response.EmailResponse;
import com.raindrop.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/email")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailController {
    EmailService emailService;
    @PostMapping
    public ApiResponse<EmailResponse> sendEmail(@RequestBody SendEmailRequest request) {
        log.info("Received request to send email to: {}", request.getTo().getEmail());
        return ApiResponse.<EmailResponse>builder()
                .message("Email sent successfully")
                .result(emailService.sendEmail(request))
                .build();
    }
}
