import React, { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../utils/api.js";
import { FormValidator } from "../../utils/formValidator.js";
import { RoleEnum } from "../../constants/role.js";
import { DisciplineEnum } from "../../constants/disciplines.js";
import Loading from "../Loading.jsx";
import {translateMessage, createTranslationMessage} from "../../utils/i18nMessage.js";

export default function RegisterForm({ user, authChecked, setUser }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

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
    const [loading, setLoading] = useState(false);

    const isEmployer = role === RoleEnum.EMPLOYEUR.value;
    const hasProgramme = role === RoleEnum.ETUDIANT.value || role === RoleEnum.PROFESSEUR.value;

    const programmes = [
        { value: DisciplineEnum.INFORMATIQUE.value, label: t("auth.register.disciplines.informatique") },
        { value: DisciplineEnum.INFIRMIERE.value, label: t("auth.register.disciplines.infirmiere") },
        { value: DisciplineEnum.ARCHITECTURE.value, label: t("auth.register.disciplines.architecture") },
        { value: DisciplineEnum.ADMINISTRATION.value, label: t("auth.register.disciplines.administration") },
        { value: DisciplineEnum.COMPTABILITE.value, label: t("auth.register.disciplines.comptabilite") },
        { value: DisciplineEnum.EDUCATION.value, label: t("auth.register.disciplines.education") },
        { value: DisciplineEnum.GENIE_CIVIL.value, label: t("auth.register.disciplines.genieCivil") },
        { value: DisciplineEnum.MARKETING.value, label: t("auth.register.disciplines.marketing") },
        { value: DisciplineEnum.DESIGN_GRAPHIQUE.value, label: t("auth.register.disciplines.designGraphique") },
    ];

    const validate = (name, value, currentFormData = formData) => {
        const errorMsg = FormValidator.validateField(name, value, currentFormData, isEmployer);

        setFieldErrors((prev) => {
            const next = { ...prev, [name]: errorMsg };
            if (name === "password" && currentFormData.confirmPassword) {
                next.confirmPassword =
                    value === currentFormData.confirmPassword
                        ? ""
                        : "auth.register.errors.confirmPassword";
            }
            return next;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);

        if (touched[name]) {
            validate(name, value, updatedData);
        }
        if (name === "password" && touched.confirmPassword) {
            validate("confirmPassword", updatedData.confirmPassword, updatedData);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        validate(name, value);
    };

    const isFormValid = useMemo(
        () => FormValidator.isRegisterFormValid(formData, isEmployer, fieldErrors),
        [formData, role, fieldErrors, isEmployer]
    );

    const getRedirectPath = (userRole) => {
        switch (userRole) {
            case RoleEnum.ETUDIANT.value:
                return "/etudiant";
            case RoleEnum.PROFESSEUR.value:
                return "/professeur";
            case RoleEnum.EMPLOYEUR.value:
                return "/employeur";
            case RoleEnum.GESTIONNAIRE.value:
                return "/gestionnaire";
            default:
                return "/";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        setTouched({
            prenom: true,
            nom: true,
            email: true,
            password: true,
            confirmPassword: true,
            entreprise: isEmployer,
        });

        if (!FormValidator.isRegisterFormValid(formData, isEmployer, fieldErrors)) {
            return;
        }

        setLoading(true);

        const payload = {
            nom: formData.nom.trim(),
            prenom: formData.prenom.trim(),
            email: formData.email.trim().toLowerCase(),
            role: role.toUpperCase(),
            password: formData.password,
            affiliation: hasProgramme ? formData.programme : formData.entreprise.trim(),
        };

        try {
            const regResponse = await api.auth.register(payload);

            if (!regResponse.ok) {
                switch (regResponse.status) {
                    case 400:
                        throw createTranslationMessage( "auth.register.errors.invalidData");
                    case 401:
                        throw createTranslationMessage("auth.register.errors.unauthorized");
                    case 404:
                        throw createTranslationMessage("auth.register.errors.unavailable");
                    default:
                        throw createTranslationMessage( "auth.register.errors.submit");
                }
            }

            const loginResponse = await api.auth.login({
                email: payload.email,
                password: payload.password,
            });

            if (!loginResponse.ok) {
                navigate("/login");
                return;
            }

            const loginData = await loginResponse.json();
            localStorage.setItem("token", loginData.accessToken || loginData.token);

            const meResponse = await api.auth.getMe();
            if (meResponse.ok) {
                const userData = await meResponse.json();
                if (setUser) {
                    setUser({ ...userData, isLoggedIn: true });
                }
                navigate(getRedirectPath(userData.role));
            } else {
                navigate(getRedirectPath(payload.role));
            }
        } catch (err) {
            setServerError(err?.key || "auth.register.errors.submit");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (fieldName) =>
        `w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none focus:ring-4 focus:ring-pink/40 ${
            touched[fieldName] && fieldErrors[fieldName]
                ? "border-error focus:border-error"
                : "border-line focus:border-lavender"
        }`;

    if (!authChecked) {
        return <Loading />;
    }

    if (user?.isLoggedIn) {
        return <Navigate to={getRedirectPath(user.role)} replace/>;
    }

    return (
        <section className="flex flex-1 items-center justify-center bg-canvas px-4 py-8 sm:px-6 sm:py-12">
            <div className="w-full max-w-sm rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:max-w-md sm:p-8 md:max-w-lg">
                <h2 className="mb-5 text-center text-2xl font-black tracking-tight text-ink sm:mb-6 sm:text-3xl">
                    {t("auth.register.title")}
                </h2>

                <div className="mb-5 sm:mb-6">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                        {Object.entries(RoleEnum)
                            .filter(([_, value]) => value.value !== "ROLE_GESTIONNAIRE")
                            .map(([key, value]) => (
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
                    <div className="grid gap-4 sm:grid-cols-2">
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
                                <p className="mt-1 text-xs text-error">{translateMessage(t, fieldErrors.prenom)}</p>
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
                                <p className="mt-1 text-xs text-error">{translateMessage(t, fieldErrors.nom)}</p>
                            )}
                        </div>
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
                            <p className="mt-1 text-xs text-error">{translateMessage(t, fieldErrors.email)}</p>
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
                            <p className="mt-1 text-xs text-error">{translateMessage(t, fieldErrors.password)}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="confirmPassword">
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
                            <p className="mt-1 text-xs text-error">{translateMessage(t, fieldErrors.confirmPassword)}</p>
                        )}
                    </div>

                    {hasProgramme && (
                        <div>
                            <label className="mb-1 block text-sm font-bold text-ink" htmlFor="programme">
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
                            <label className="mb-1 block text-sm font-bold text-ink" htmlFor="entreprise">
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
                                <p className="mt-1 text-xs text-error">{translateMessage(t, fieldErrors.entreprise)}</p>
                            )}
                        </div>
                    )}

                    {serverError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-error">
                            {translateMessage(t, serverError)}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!isFormValid || loading}
                        className="w-full rounded-xl bg-ink py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                    >
                        {loading ? t("auth.register.submitting") : t("auth.register.submit")}
                    </button>
                </form>
            </div>
        </section>
    );
}
