package com.clinic.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class BackendApplication {
  public static void main(String[] args) {
    TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    DotenvPropertyLoader.loadIntoSystemProperties();
    SpringApplication.run(BackendApplication.class, args);
  }
}
