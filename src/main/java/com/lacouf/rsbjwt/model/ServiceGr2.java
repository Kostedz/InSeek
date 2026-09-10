package com.lacouf.rsbjwt.model;


import com.lacouf.rsbjwt.repository.ClientRepository;
import com.lacouf.rsbjwt.repository.EmprunteurRepository;

public class ServiceGr2 {

    private final ClientRepository clientRepository;
    private final EmprunteurRepository emprunteurRepository;

    public ServiceGr2(ClientRepository clientRepository, EmprunteurRepository emprunteurRepository) {
        this.clientRepository = clientRepository;
        this.emprunteurRepository = emprunteurRepository;
    }

    public Client saveClient(String nom) {
        return clientRepository.saveClient(nom);
    }
}
