package com.clinic.backend.common.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiError.of("BAD_REQUEST", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(err -> err.getDefaultMessage() != null ? err.getDefaultMessage() : err.getField() + " invalid")
        .orElse("Validation failed");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiError.of("VALIDATION_ERROR", message));
  }

  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<ApiError> handleMissingHeader(MissingRequestHeaderException ex) {
    if ("Authorization".equalsIgnoreCase(ex.getHeaderName())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiError.of("UNAUTHORIZED", "Thiếu token xác thực"));
    }
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiError.of("BAD_REQUEST", "Thiếu header bắt buộc: " + ex.getHeaderName()));
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex) {
    String path = ex.getResourcePath();
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiError.of("NOT_FOUND", "API không tồn tại: " + path));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of("FORBIDDEN", "Không có quyền truy cập"));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex) {
    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
    String code = status.is4xxClientError() ? "BAD_REQUEST" : "INTERNAL_ERROR";
    String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
    return ResponseEntity.status(status).body(ApiError.of(code, message));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex) {
    String message = "Dữ liệu xung đột. Vui lòng thử lại.";
    if (ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage() != null) {
      String detail = ex.getMostSpecificCause().getMessage();
      if (detail.contains("bookings_slot_id_key")) {
        message = "Khung giờ vừa được người khác đặt. Vui lòng chọn lại ca khám.";
      } else if (detail.contains("prescription_items_prescription_id_medication_id_key")) {
        message = "Toa thuốc bị trùng hoạt chất. Vui lòng chỉ giữ 1 dòng cho mỗi thuốc.";
      }
    }
    return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of("CONFLICT", message));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex) {
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiError.of("INTERNAL_ERROR", "Lỗi hệ thống, vui lòng thử lại."));
  }
}
