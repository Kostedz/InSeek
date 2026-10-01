export class FormValidator {
    static REGEX = {
        name: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{2,30}$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    };

    static validateField(name, value, formData, isEmployer, t) {
        switch (name) {
            case "prenom":
                if (!this.REGEX.name.test(value.trim())) {
                    return t("auth.register.errors.firstName");
                }
                break;
            case "nom":
                if (!this.REGEX.name.test(value.trim())) {
                    return t("auth.register.errors.lastName");
                }
                break;
            case "email":
                if (!this.REGEX.email.test(value.trim())) {
                    return t("auth.register.errors.email");
                }
                break;
            case "password":
                if (!this.REGEX.password.test(value)) {
                    return t("auth.register.errors.password");
                }
                break;
            case "confirmPassword":
                if (value !== formData.password) {
                    return t("auth.register.errors.confirmPassword");
                }
                break;
            case "entreprise":
                if (isEmployer && value.trim() === "") {
                    return t("auth.register.errors.companyRequired");
                }
                break;
            default:
                return "";
        }
        return "";
    }

    static isRegisterFormValid(formData, isEmployer, fieldErrors) {
        const isPrenomValid = this.REGEX.name.test(formData.prenom.trim());
        const isNomValid = this.REGEX.name.test(formData.nom.trim());
        const isEmailValid = this.REGEX.email.test(formData.email.trim());
        const isPasswordValid = this.REGEX.password.test(formData.password);
        const isConfirmPasswordValid =
            formData.password === formData.confirmPassword && formData.confirmPassword !== "";
        const isEntrepriseValid = isEmployer ? formData.entreprise.trim() !== "" : true;

        const hasNoErrors = Object.values(fieldErrors).every((err) => !err);

        return (
            isPrenomValid &&
            isNomValid &&
            isEmailValid &&
            isPasswordValid &&
            isConfirmPasswordValid &&
            isEntrepriseValid &&
            hasNoErrors
        );
    }
}

export default FormValidator;