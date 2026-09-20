    package com.lacouf.rsbjwt.service.dto;

    import com.lacouf.rsbjwt.model.Prepose;
    import com.lacouf.rsbjwt.model.auth.Role;
    import lombok.Builder;

    public class PreposeDto extends UserDTO {
        private String passeKey;

        @Builder
        public PreposeDto(Long id, String firstName, String lastname, String email, Role role, String passeKey) {
            super(id, firstName, lastname, email, role);
            this.passeKey = passeKey;
        }

        public PreposeDto() {}

        public static PreposeDto create(Prepose prepose) {
            return PreposeDto.builder()
                    .id(prepose.getId())
                    .firstName(prepose.getFirstName())
                    .lastname(prepose.getLastName())
                    .email(prepose.getEmail())
                    .role(prepose.getRole())
                    .passeKey(prepose.getPasseKey())
                    .build();
        }

        public static PreposeDto empty() {
            return new PreposeDto();
        }
    }
