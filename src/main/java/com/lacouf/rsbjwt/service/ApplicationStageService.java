package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.repository.ApplicationStageRepository;
import org.springframework.stereotype.Service;

@Service
public class ApplicationStageService {

    private final ApplicationStageRepository applicationStageRepository;

    public ApplicationStageService (ApplicationStageRepository applicationStageRepository){
        this.applicationStageRepository = applicationStageRepository;
    }




}
