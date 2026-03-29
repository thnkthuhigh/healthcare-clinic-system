package com.clinic.backend.security;

import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SmsSender smsSender;

    @Mock
    private TotpService totpService;

    @InjectMocks
    private AuthService authService;

    @Test
    void verifyResetChallengeForDoctorIssuesShortLivedResetSession() {
        User doctor = new User();
        doctor.setPhone("0902345678");
        doctor.setRole(User.UserRole.DOCTOR);
        doctor.setTotpSecret("SECRET123");

        AtomicReference<PasswordResetToken> savedToken = new AtomicReference<>();

        when(userRepository.findByPhone(doctor.getPhone())).thenReturn(Optional.of(doctor));
        when(totpService.verifyCode(eq("SECRET123"), eq("123456"), any(Instant.class))).thenReturn(true);
        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> {
            PasswordResetToken token = invocation.getArgument(0);
            savedToken.set(token);
            return token;
        });

        Map<String, String> result = authService.verifyResetChallenge(doctor.getPhone(), "123456");

        assertNotNull(result.get("resetToken"));
        assertEquals(result.get("resetToken"), savedToken.get().getCode());
        assertTrue(savedToken.get().getExpiresAt().isAfter(Instant.now()));
        assertNotNull(doctor.getTotpConfirmedAt());

        verify(userRepository).save(doctor);
        verify(tokenRepository).deleteByPhone(doctor.getPhone());
    }

    @Test
    void resetPasswordUsesIssuedResetTokenInsteadOfOtp() {
        User user = new User();
        user.setPhone("0912345678");
        user.setRole(User.UserRole.PATIENT);

        PasswordResetToken resetSession = new PasswordResetToken();
        resetSession.setPhone(user.getPhone());
        resetSession.setCode("session-token");
        resetSession.setExpiresAt(Instant.now().plusSeconds(300));

        when(tokenRepository.findFirstByPhoneOrderByCreatedAtDesc(user.getPhone()))
                .thenReturn(Optional.of(resetSession));
        when(userRepository.findByPhone(user.getPhone())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-password");

        authService.resetPassword(user.getPhone(), "session-token", "new-password");

        assertEquals("encoded-password", user.getPasswordHash());
        assertNotNull(user.getUpdatedAt());

        verify(userRepository).save(user);
        verify(tokenRepository).deleteByPhone(user.getPhone());
    }
}
