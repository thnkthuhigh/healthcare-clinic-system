package com.clinic.backend;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

final class DotenvPropertyLoader {
    private DotenvPropertyLoader() {
    }

    static void loadIntoSystemProperties() {
        for (Path candidate : candidatePaths()) {
            if (!Files.exists(candidate) || !Files.isRegularFile(candidate)) {
                continue;
            }
            loadFile(candidate);
            return;
        }
    }

    private static Set<Path> candidatePaths() {
        Path current = Path.of("").toAbsolutePath().normalize();
        Set<Path> paths = new LinkedHashSet<>();
        paths.add(current.resolve(".env"));
        paths.add(current.resolve("..").resolve(".env").normalize());
        paths.add(current.resolve("..").resolve("..").resolve(".env").normalize());
        return paths;
    }

    private static void loadFile(Path file) {
        try {
            List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
            for (String rawLine : lines) {
                String line = rawLine == null ? "" : rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int delimiterIndex = line.indexOf('=');
                if (delimiterIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, delimiterIndex).trim();
                String value = line.substring(delimiterIndex + 1).trim();
                if (key.isEmpty()) {
                    continue;
                }

                if ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }

                if (System.getProperty(key) != null || System.getenv(key) != null) {
                    continue;
                }

                System.setProperty(key, value);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Khong the doc file .env tai " + file, ex);
        }
    }
}
