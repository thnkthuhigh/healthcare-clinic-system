package com.clinic.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

@Service
public class TotpService {
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final long TIME_STEP_SECONDS = 30L;
    private static final int CODE_DIGITS = 6;
    private static final int SECRET_BYTES = 20;

    private final SecureRandom secureRandom = new SecureRandom();
    private final String issuer;

    public TotpService(@Value("${app.totp.issuer:Clinic}") String issuer) {
        this.issuer = issuer;
    }

    public String getIssuer() {
        return issuer;
    }

    public String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        secureRandom.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    public String buildOtpAuthUri(String accountName, String secret) {
        String label = issuer + ":" + accountName;
        return "otpauth://totp/"
                + urlEncode(label)
                + "?secret="
                + urlEncode(secret)
                + "&issuer="
                + urlEncode(issuer)
                + "&algorithm=SHA1&digits="
                + CODE_DIGITS
                + "&period="
                + TIME_STEP_SECONDS;
    }

    public boolean verifyCode(String secret, String rawCode, Instant now) {
        String code = normalizeCode(rawCode);
        if (secret == null || secret.isBlank() || code == null) {
            return false;
        }

        long currentWindow = Math.floorDiv(now.getEpochSecond(), TIME_STEP_SECONDS);
        for (long window = currentWindow - 1; window <= currentWindow + 1; window++) {
            if (generateCode(secret, window).equals(code)) {
                return true;
            }
        }
        return false;
    }

    String generateCurrentCode(String secret, Instant now) {
        long currentWindow = Math.floorDiv(now.getEpochSecond(), TIME_STEP_SECONDS);
        return generateCode(secret, currentWindow);
    }

    private String generateCode(String secret, long window) {
        byte[] secretBytes = decodeBase32(secret);
        byte[] data = new byte[8];
        long value = window;
        for (int i = 7; i >= 0; i--) {
            data[i] = (byte) (value & 0xff);
            value >>= 8;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            int otp = binary % (int) Math.pow(10, CODE_DIGITS);
            return String.format("%0" + CODE_DIGITS + "d", otp);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to generate TOTP code", ex);
        }
    }

    private String normalizeCode(String rawCode) {
        if (rawCode == null) {
            return null;
        }
        String code = rawCode.replaceAll("\\D", "");
        return code.length() == CODE_DIGITS ? code : null;
    }

    private byte[] decodeBase32(String rawSecret) {
        String normalized = rawSecret
                .replace("=", "")
                .replace(" ", "")
                .toUpperCase(Locale.ROOT);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int buffer = 0;
        int bitsLeft = 0;

        for (int i = 0; i < normalized.length(); i++) {
            int value = BASE32_ALPHABET.indexOf(normalized.charAt(i));
            if (value < 0) {
                throw new IllegalArgumentException("TOTP secret khong hop le");
            }
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            while (bitsLeft >= 8) {
                output.write((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }

        return output.toByteArray();
    }

    private String encodeBase32(byte[] bytes) {
        StringBuilder encoded = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;

        for (byte value : bytes) {
            buffer = (buffer << 8) | (value & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                encoded.append(BASE32_ALPHABET.charAt((buffer >> (bitsLeft - 5)) & 0x1f));
                bitsLeft -= 5;
            }
        }

        if (bitsLeft > 0) {
            encoded.append(BASE32_ALPHABET.charAt((buffer << (5 - bitsLeft)) & 0x1f));
        }

        return encoded.toString();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
