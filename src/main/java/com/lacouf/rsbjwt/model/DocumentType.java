package com.lacouf.rsbjwt.model;

public enum DocumentType {
    CV("CV"),
    INTERNSHIP("INTERNSHIP");

    private String string;

    DocumentType(String string) {
        this.string = string;
    }
}
