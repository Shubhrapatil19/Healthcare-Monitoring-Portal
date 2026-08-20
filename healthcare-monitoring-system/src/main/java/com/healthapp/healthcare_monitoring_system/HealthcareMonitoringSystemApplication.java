package com.healthapp.healthcare_monitoring_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HealthcareMonitoringSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealthcareMonitoringSystemApplication.class, args);
	}
}
