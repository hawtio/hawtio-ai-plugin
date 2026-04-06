package io.hawt.ai.app;

import io.hawt.springboot4.HawtioPlugin;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SampleSpringBootService {

    public static void main(String[] args) {
        SpringApplication.run(SampleSpringBootService.class, args);
    }

    @Bean
    public HawtioPlugin registerPlugin() {
        return new HawtioPlugin("hawtioAiPlugin", "./plugin");
    }
}
