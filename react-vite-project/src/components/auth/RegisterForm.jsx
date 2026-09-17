import React, { useState } from "react";
import fetcher from "../../utils/fetcher.js";
import { useNavigate } from "react-router-dom";


export default function RegisterForm() {
    const [role, setRole] = useState("etudiant");
    const [formData, setFormData] = useState({
        prenom: "",
        nom: "",
        email: "",
        password: "",
        confirmPassword: "",
        programme: "Informatique",
        entreprise: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState(null);
    const navigate = useNavigate();

    const programmes = [
        "Informatique",
        "Tech. Infirmière",
        "Architecture",
        "Gestion de commerce",
    ];

    const entreprises = [
        "Ubisoft",
        "Google",
        "Microsoft",
        "Apple",
    ];

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
                    errorMsg = "Le prénom doit contenir entre 2 et 30 caractères alphabétiques.";
                }
                break;
            case "nom":
                if (!REGEX.name.test(value.trim())) {
                    errorMsg = "Le nom doit contenir entre 2 et 30 caractères alphabétiques.";
                }
                break;
            case "email":
                if (!REGEX.email.test(value.trim())) {
                    errorMsg = "Adresse courriel invalide. Exemple : example123@example.com";
                }
                break;
            case "password":
                if (!REGEX.password.test(value)) {
                    errorMsg = "Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole";
                }
                break;
            case "confirmPassword":
                if (value !== currentFormData.password) {
                    errorMsg = "Les mots de passe ne correspondent pas.";
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
                        : "Les mots de passe ne correspondent pas.";
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const allTouched = {
            prenom: true,
            nom: true,
            email: true,
            password: true,
            confirmPassword: true,
        };
        setTouched(allTouched);

        const currentFormData = formData;
        validateField("prenom", currentFormData.prenom, currentFormData);
        validateField("nom", currentFormData.nom, currentFormData);
        validateField("email", currentFormData.email, currentFormData);
        validateField("password", currentFormData.password, currentFormData);
        validateField("confirmPassword", currentFormData.confirmPassword, currentFormData);

        const hasErrors =
            !REGEX.name.test(currentFormData.prenom.trim()) ||
            !REGEX.name.test(currentFormData.nom.trim()) ||
            !REGEX.email.test(currentFormData.email.trim()) ||
            !REGEX.password.test(currentFormData.password) ||
            currentFormData.password !== currentFormData.confirmPassword;

        if (hasErrors) return;

        const payload = {
            prenom: currentFormData.prenom.trim(),
            nom: currentFormData.nom.trim(),
            email: currentFormData.email.trim().toLowerCase(),
            password: currentFormData.password,
            role,
            programme:
                role === "etudiant" || role === "professeur" ? currentFormData.programme : null,
            compagnie: role === "employeur" ? currentFormData.compagnie : null,
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
                        throw new Error("Données invalides ou courriel déjà utilisé.");
                    case 401:
                        throw new Error("Accès non autorisé.");
                    case 404:
                        throw new Error("Serveur non disponible.");
                    default:
                        throw new Error("Erreur lors de l'inscription.");
                }
            }

            const data = await response.json();
            localStorage.setItem("token", data.accessToken);

            const userResponse = await fetcher("user/me", {});
            if (!userResponse.ok) {
                throw new Error("Impossible de récupérer les informations de l'utilisateur.");
            }

            const userData = await userResponse.json();
            const userRole = userData.role;

            if (userRole === "ROLE_EMPRUNTEUR") {
                navigate("/emprunteur");
            } else if (userRole === "ROLE_PREPOSE") {
                navigate("/prepose");
            } else if (userRole === "ROLE_GESTIONNAIRE") {
                navigate("/gestionnaire");
            } else {
                navigate("/");
            }
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
                    Créer un compte
                </h2>

                <div className="mb-5 sm:mb-6">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                        {[
                            { id: "employeur", label: "Employeur" },
                            { id: "etudiant", label: "Étudiant" },
                            { id: "professeur", label: "Professeur" },
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setRole(option.id)}
                                aria-pressed={role === option.id}
                                className={`flex items-center justify-center rounded-xl border p-2 text-center transition-all sm:flex-col sm:gap-1 sm:p-3 ${
                                    role === option.id
                                        ? "bg-ink border-ink text-white hover:bg-ink-soft"
                                        : "bg-surface border-line text-ink-soft hover:border-pink"
                                }`}
                            >
                                <span
                                    className={`text-sm font-medium ${
                                        role === option.id ? "text-white" : "text-ink-soft"
                                    }`}
                                >
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="prenom">
                            Prénom
                        </label>
                        <input
                            id="prenom"
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Pascal"
                            aria-invalid={Boolean(touched.prenom && fieldErrors.prenom)}
                            className={inputClass("prenom")}
                        />
                        {touched.prenom && fieldErrors.prenom && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.prenom}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="nom">
                            Nom
                        </label>
                        <input
                            id="nom"
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Dupont"
                            aria-invalid={Boolean(touched.nom && fieldErrors.nom)}
                            className={inputClass("nom")}
                        />
                        {touched.nom && fieldErrors.nom && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.nom}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="email">
                            Adresse courriel
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="nom@exemple.com"
                            aria-invalid={Boolean(touched.email && fieldErrors.email)}
                            className={inputClass("email")}
                        />
                        {touched.email && fieldErrors.email && (
                            <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-ink" htmlFor="password">
                            Mot de passe
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
                            Confirmer le mot de passe
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

                    {(role === "etudiant" || role === "professeur") && (
                        <div>
                            <label
                                className="mb-1 block text-sm font-bold text-ink"
                                htmlFor="programme"
                            >
                                Programme / Discipline
                            </label>
                            <select
                                id="programme"
                                name="programme"
                                value={formData.programme}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender focus:ring-4 focus:ring-pink/40"
                            >
                                {programmes.map((prog) => (
                                    <option key={prog} value={prog}>
                                        {prog}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {role === "employeur" && (
                        <div>
                            <label
                                className="mb-1 block text-sm font-bold text-ink"
                                htmlFor="entreprise"
                            >
                                Nom de l'entreprise
                            </label>
                           <select id="entreprise"
                                name="entreprise"
                                value={formData.entreprise}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender focus:ring-4 focus:ring-pink/40"
                            >
                                {entreprises.map((entreprise) => (
                                    <option key={entreprise} value={entreprise}>
                                        {entreprise}
                                    </option>
                                ))}
                            </select>
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
                        className="w-full rounded-xl bg-ink py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50"
                    >
                        S'inscrire
                    </button>
                </form>
            </div>
        </section>
    );
}
