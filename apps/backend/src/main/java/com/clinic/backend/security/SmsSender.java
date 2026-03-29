package com.clinic.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;

@Service
public class SmsSender {

    private final String provider;
    private final String brandName;
    private final String defaultCountryCode;
    private final String twilioAccountSid;
    private final String twilioAuthToken;
    private final String twilioFromNumber;
    private final HttpClient httpClient;

    public SmsSender(
            @Value("${app.sms.provider:none}") String provider,
            @Value("${app.sms.brand-name:Healthcare Clinic}") String brandName,
            @Value("${app.sms.default-country-code:84}") String defaultCountryCode,
            @Value("${app.sms.twilio.account-sid:}") String twilioAccountSid,
            @Value("${app.sms.twilio.auth-token:}") String twilioAuthToken,
            @Value("${app.sms.twilio.from-number:}") String twilioFromNumber) {
        this.provider = provider == null ? "none" : provider.trim();
        this.brandName = brandName == null ? "Healthcare Clinic" : brandName.trim();
        this.defaultCountryCode = defaultCountryCode == null ? "84" : defaultCountryCode.trim();
        this.twilioAccountSid = twilioAccountSid == null ? "" : twilioAccountSid.trim();
        this.twilioAuthToken = twilioAuthToken == null ? "" : twilioAuthToken.trim();
        this.twilioFromNumber = twilioFromNumber == null ? "" : twilioFromNumber.trim();
        this.httpClient = HttpClient.newHttpClient();
    }

    public boolean isConfigured() {
        return switch (provider.toLowerCase(Locale.ROOT)) {
            case "twilio" -> !twilioAccountSid.isBlank()
                    && !twilioAuthToken.isBlank()
                    && !twilioFromNumber.isBlank();
            default -> false;
        };
    }

    public void sendOtp(String phone, String code) {
        if (!isConfigured()) {
            throw new IllegalStateException("SMS provider is not configured");
        }

        String message = brandName + ": Ma OTP dat lai mat khau cua ban la " + code + ". Ma het han sau 10 phut.";

        switch (provider.toLowerCase(Locale.ROOT)) {
            case "twilio" -> sendViaTwilio(phone, message);
            default -> throw new IllegalStateException("Unsupported SMS provider: " + provider);
        }
    }

    private void sendViaTwilio(String phone, String message) {
        String normalizedPhone = normalizePhone(phone);
        String endpoint = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";
        String auth = Base64.getEncoder()
                .encodeToString((twilioAccountSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));
        String body = "To=" + urlEncode(normalizedPhone)
                + "&From=" + urlEncode(twilioFromNumber)
                + "&Body=" + urlEncode(message);

        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Twilio SMS request failed with status "
                        + response.statusCode() + ": " + response.body());
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Twilio SMS request was interrupted", ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send SMS via Twilio", ex);
        }
    }

    private String normalizePhone(String phone) {
        String normalized = phone == null ? "" : phone.replaceAll("[^\\d+]", "").trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Phone number is required for SMS");
        }
        if (normalized.startsWith("+")) {
            return normalized;
        }
        if (normalized.startsWith("00")) {
            return "+" + normalized.substring(2);
        }
        if (normalized.startsWith("0")) {
            return "+" + defaultCountryCode + normalized.substring(1);
        }
        return "+" + normalized;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
