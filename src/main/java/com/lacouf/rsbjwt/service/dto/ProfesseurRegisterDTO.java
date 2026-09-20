package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Disciplines;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfesseurRegisterDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String affilitation;
    private Disciplines discipline;

}
