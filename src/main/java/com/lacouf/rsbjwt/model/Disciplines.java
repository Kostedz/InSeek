package com.lacouf.rsbjwt.model;

public enum Disciplines {
    INFORMATIQUE("INFORMATIQUE"),
    INFIRMIERE("INFIRMIERE"),
    ARCHITECTURE("ARCHITECTURE"),
    ADMINISTRATION("ADMINISTRATION"),
    COMPTABILITE("COMPTABILITE"),
    EDUCATION("EDUCATION"),
    GENIE_CIVIL("GENIE_CIVIL"),
    MARKETING("MARKETING"),
    DESIGN_GRAPHIQUE("DESIGN_GRAPHIQUE");

    public String string;

    Disciplines(String string){
        this.string = string;
    }}
