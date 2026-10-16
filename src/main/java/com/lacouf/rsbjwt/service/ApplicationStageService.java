package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.repository.ApplicationStageRepository;

public class ApplicationStageService {

    private final ApplicationStageRepository applicationStageRepository;

    public ApplicationStageService (ApplicationStageRepository applicationStageRepository){
        this.applicationStageRepository = applicationStageRepository;
    }


}
