package com.lacouf.rsbjwt.event;

import com.lacouf.rsbjwt.model.ApplicationStage;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CandidatureSoumiseEvent extends ApplicationEvent {
    private final ApplicationStage applicationStage;

    public CandidatureSoumiseEvent(Object source, ApplicationStage applicationStage) {
        super(source);
        this.applicationStage = applicationStage;
    }
}