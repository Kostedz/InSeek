package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Client;

public interface ClientRepository {
    Client saveClient(String nom);
}

