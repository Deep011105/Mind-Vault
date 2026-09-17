package com.lifevault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// Note: package/class name kept as "lifevault" from the original project to avoid
// a mechanical rename across every file; the product-facing name is "MindVault"
// (see pom.xml artifactId / application name).
@SpringBootApplication
@EnableAsync
public class LifeVaultApplication {

	public static void main(String[] args) {
		SpringApplication.run(LifeVaultApplication.class, args);
	}

}
