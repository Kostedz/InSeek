package com.lacouf.rsbjwt.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionDTO {
    private String id;
    private String name;
    private boolean isCurrent;
}
