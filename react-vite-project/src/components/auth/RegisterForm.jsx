import React, { useState } from "react";
import fetcher from "../../utils/fetcher.js";
import { useNavigate } from "react-router-dom";
import { RoleEnum} from "../../constants/role.js";
import { DisciplineEnum} from "../../constants/disciplines.js";
import { useTranslation } from "react-i18next";


export default function RegisterForm() {
    const { t } = useTranslation();
    const [role, setRole] = useState(RoleEnum.ETUDIANT.value);
    const [formData, setFormData] = useState({
        prenom: "",
        nom: "",
        email: "",
        password: "",
        confirmPassword: "",
        programme: DisciplineEnum.INFORMATIQUE.value,
        entreprise: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState(null);
    const navigate = useNavigate();

    const programmes = [
        { value: DisciplineEnum.INFORMATIQUE.value, label: t("auth.register.disciplines.informatique") },
        { value: DisciplineEnum.INFIRMIERE.value, label: t("auth.register.disciplines.infirmiere") },
        { value: DisciplineEnum.ARCHITECTURE.value, label: t("auth.register.disciplines.architecture") },
    ];

    const isEmployer = role === RoleEnum.EMPLOYEUR.value;
    const hasProgramme = role === RoleEnum.ETUDIANT.value || role === RoleEnum.PROFESSEUR.value;

    const REGEX = {
        name: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{2,30}$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    };

    const validateField = (name, value, currentFormData = formData) => {
        let errorMsg = "";

        switch (name) {
            case "prenom":
                if (!REGEX.name.test(value.trim())) {
                    errorMsg = t("auth.register.errors.firstName");
                }
                break;
            case "nom":
                if (!REGEX.name.test(value.trim())) {
                    errorMsg = t("auth.register.errors.lastName");
                }
                break;
            case "email":
                if (!REGEX.email.test(value.trim())) {
                    errorMsg = t("auth.register.errors.email");
                }
                break;
            case "password":
                if (!REGEX.password.test(value)) {
                    errorMsg = t("auth.register.errors.password");
                }
                break;
            case "confirmPassword":
                if (value !== currentFormData.password) {
                    errorMsg = t("auth.register.errors.confirmPassword");
                }
                break;
            case "entreprise":
                if (isEmployer && value.trim() === "") {
                    errorMsg = t("auth.register.errors.companyRequired");
                }
                break;
            default:
                break;
        }

        setFieldErrors((previousErrors) => {
            const nextErrors = { ...previousErrors, [name]: errorMsg };

            if (name === "password" && currentFormData.confirmPassword) {
                nextErrors.confirmPassword =
                    value === currentFormData.confirmPassword
                        ? ""
                        : t("auth.register.errors.confirmPassword");
            }

            return nextErrors;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);

        if (touched[name]) {
            validateField(name, value, newFormData);
        }

        if (name === "password" && touched.confirmPassword) {
            validateField("confirmPassword", newFormData.confirmPassword, newFormData);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((previousTouched) => ({ ...previousTouched, [name]: true }));
        validateField(name, value);
    };
    const isFormValid = React.useMemo(() => {
        const isPrenomValid = REGEX.name.test(formData.prenom.trim());
        const isNomValid = REGEX.name.test(formData.nom.trim());
        const isEmailValid = REGEX.email.test(formData.email.trim());
        const isPasswordValid = REGEX.password.test(formData.password);
        const isConfirmPasswordValid = formData.password === formData.confirmPassword && formData.confirmPassword !== "";
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
    }, [formData, role, fieldErrors]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const allTouched = {
            prenom: true,
            nom: true,
            email: true,
            password: true,
            confirmPassword: true,
            entreprise: isEmployer,
        };
        setTouched(allTouched);

        const currentFormData = formData;
        validateField("prenom", currentFormData.prenom, currentFormData);
        validateField("nom", currentFormData.nom, currentFormData);
        validateField("email", currentFormData.email, currentFormData);
        validateField("password", currentFormData.password, currentFormData);
        validateField("confirmPassword", currentFormData.confirmPassword, currentFormData);
        if (isEmployer) {
            validateField("entreprise", currentFormData.entreprise, currentFormData);
        }

        const hasErrors =
            !REGEX.name.test(currentFormData.prenom.trim()) ||
            !REGEX.name.test(currentFormData.nom.trim()) ||
            !REGEX.email.test(currentFormData.email.trim()) ||
            !REGEX.password.test(currentFormData.password) ||
            currentFormData.password !== currentFormData.confirmPassword ||
            (isEmployer && !currentFormData.entreprise.trim());

        if (hasErrors) return;

        const payload = {
            nom: currentFormData.nom.trim(),
            prenom: currentFormData.prenom.trim(),
            email: currentFormData.email.trim().toLowerCase(),
            role: role.toUpperCase(),
            password: currentFormData.password,
            affiliation: hasProgramme ? currentFormData.programme : currentFormData.entreprise.trim(),
        };

        try {
            const response = await fetcher("/user/register", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                switch (response.status) {
                    case 400:
                        throw new Error(t("auth.register.errors.invalidData"));
                    case 401:
                        throw new Error(t("auth.register.errors.unauthorized"));
                    case 404:
                        throw new Error(t("auth.register.errors.unavailable"));
                    default:
                        throw new Error(t("auth.register.errors.submit"));
                }
            }

            navigate("/login");
        } catch (err) {
            setServerError(err.message);
        }
    };

    const inputClass = (fieldName) =>
        `w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none focus:ring-4 focus:ring-pink/40 ${
            touched[fieldName] && fieldErrors[fieldName]
                ? "border-error focus:border-error"
                : "border-line focus:border-lavender"
        }`;

    return (
        <section className="flex flex-1 items-center justify-center bg-canvas px-4 py-8 sm:px-6 sm:py-12">
            <div className="w-full max-w-sm rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:max-w-md sm:p-8 md:max-w-lg">
                <h2 className="mb-5 text-center text-2xl font-black tracking-tight text-ink sm:mb-6 sm:text-3xl">
                    {t("auth.register.title")}
                </h2>

                <div className="mb-5 sm:mb-6">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                        {Object.entries(RoleEnum).filter(([key, value]) => value.value !== "ROLE_GESTIONNAIRE").map(([key, value]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setRole(value.value)}
                                aria-pressed={role === value.value}
                                className={`flex items-center justify-center rounded-xl border p-2 text-center transition-all sm:flex-col sm:gap-1 sm:p-3 ${
                                    role === value.value
                                        ? "bg-ink border-ink text-white hover:bg-ink-soft"
                                        : "bg-surface border-line text-ink-soft hover:border-pink"
                                }`}
                            >
                                <span
                                    className={`text-sm font-medium ${
                                        role === value.value ? "text-white" : "text-ink-soft"
                                    }`}
                                >
                                    {t(`navigation.roles.${key.toLowerCase()}`)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="prenom">
                            {t("auth.register.firstName")}
                        </label>
                        <input
                            id="prenom"
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("auth.register.firstNamePlaceholder")}
                            aria-invalid={Boolean(touched.prenom && fieldErrors.prenom)}
                            className={inputClass("prenom")}
                        />
                        {touched.prenom && fieldErrors.prenom && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.prenom}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="nom">
                            {t("auth.register.lastName")}
                        </label>
                        <input
                            id="nom"
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("auth.register.lastNamePlaceholder")}
                            aria-invalid={Boolean(touched.nom && fieldErrors.nom)}
                            className={inputClass("nom")}
                        />
                        {touched.nom && fieldErrors.nom && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.nom}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="email">
                            {t("auth.register.email")}
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("auth.register.emailPlaceholder")}
                            aria-invalid={Boolean(touched.email && fieldErrors.email)}
                            className={inputClass("email")}
                        />
                        {touched.email && fieldErrors.email && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="password">
                            {t("auth.register.password")}
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="••••••••"
                            aria-invalid={Boolean(touched.password && fieldErrors.password)}
                            className={inputClass("password")}
                        />
                        {touched.password && fieldErrors.password && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <label
                            className="mb-1 block text-sm font-bold text-ink"
                            htmlFor="confirmPassword"
                        >
                            {t("auth.register.confirmPassword")}
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="••••••••"
                            aria-invalid={Boolean(touched.confirmPassword && fieldErrors.confirmPassword)}
                            className={inputClass("confirmPassword")}
                        />
                        {touched.confirmPassword && fieldErrors.confirmPassword && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    {hasProgramme && (
                        <div>
                            <label
                                className="mb-1 block text-sm font-bold text-ink"
                                htmlFor="programme"
                            >
                                {t("auth.register.programme")}
                            </label>
                            <select
                                id="programme"
                                name="programme"
                                value={formData.programme}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender focus:ring-4 focus:ring-pink/40"
                            >
                                {programmes.map((prog) => (
                                    <option key={prog.value} value={prog.value}>
                                        {prog.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isEmployer && (
                        <div>
                            <label
                                className="mb-1 block text-sm font-bold text-ink"
                                htmlFor="entreprise"
                            >
                                {t("auth.register.company")}
                            </label>
                            <input
                                type="text"
                                id="entreprise"
                                name="entreprise"
                                value={formData.entreprise}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder={t("auth.register.companyPlaceholder")}
                                aria-invalid={Boolean(touched.entreprise && fieldErrors.entreprise)}
                                className={inputClass("entreprise")}
                            />
                            {touched.entreprise && fieldErrors.entreprise && (
                                <p className="mt-1 text-xs text-error">{fieldErrors.entreprise}</p>
                            )}
                        </div>
                    )}

                    {serverError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-error">
                            {serverError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!isFormValid}
                        className="w-full rounded-xl bg-ink py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                    >
                        {t("auth.register.submit")}
                    </button>
                </form>
            </div>
        </section>
    );
}
