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
                    errorMsg = "Adresse courriel invalide. Example: example123@example.com";
                }
                break;
            case "password":
                if (!REGEX.password.test(value)) {
                    errorMsg = "Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole";
                }
                if (currentFormData.confirmPassword && value !== currentFormData.confirmPassword) {
                    setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: "Les mots de passe ne correspondent pas.",
                    }));
                } else if (currentFormData.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
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

        setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);

        if (touched[name]) {
            validateField(name, value, newFormData);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
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

        validateField("prenom", formData.prenom);
        validateField("nom", formData.nom);
        validateField("email", formData.email);
        validateField("password", formData.password);
        validateField("confirmPassword", formData.confirmPassword);

        const hasErrors =
            !REGEX.name.test(formData.prenom.trim()) ||
            !REGEX.name.test(formData.nom.trim()) ||
            !REGEX.email.test(formData.email.trim()) ||
            !REGEX.password.test(formData.password) ||
            formData.password !== formData.confirmPassword;

        if (hasErrors) return;

        const payload = {
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role,
            programme: role === "etudiant" || role === "professeur" ? formData.programme : null,
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md sm:max-w-md sm:p-8 md:max-w-lg">
                <h2 className="mb-5 text-center text-xl font-bold text-gray-800 sm:mb-6 sm:text-2xl">
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
                                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                                        : "bg-white border-gray-300 hover:border-gray-400"
                                }`}
                            >
                                <span
                                    className={`text-sm font-medium ${
                                        role === option.id ? "text-white" : "text-gray-700"
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
                        <label className="mb-1 block text-sm font-medium text-gray-700">Prénom</label>
                        <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Pascal"
                            className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
                                touched.prenom && fieldErrors.prenom
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                        />
                        {touched.prenom && fieldErrors.prenom && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.prenom}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Nom</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Dupont"
                            className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
                                touched.nom && fieldErrors.nom
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                        />
                        {touched.nom && fieldErrors.nom && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.nom}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Adresse courriel
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="nom@exemple.com"
                            className={`w-full rounded-lg border px-4 py-2.5 text-base focus:outline-none sm:py-2 sm:text-sm ${
                                touched.email && fieldErrors.email
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                        />
                        {touched.email && fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="••••••••"
                            className={`w-full rounded-lg border px-4 py-2.5 text-base focus:outline-none sm:py-2 sm:text-sm ${
                                touched.password && fieldErrors.password
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                        />
                        {touched.password && fieldErrors.password && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="••••••••"
                            className={`w-full rounded-lg border px-4 py-2.5 text-base focus:outline-none sm:py-2 sm:text-sm ${
                                touched.confirmPassword && fieldErrors.confirmPassword
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                        />
                        {touched.confirmPassword && fieldErrors.confirmPassword && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    {(role === "etudiant" || role === "professeur") && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Programme / Discipline
                            </label>
                            <select
                                name="programme"
                                value={formData.programme}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
                            >
                                {programmes.map((prog, index) => (
                                    <option key={index} value={prog}>
                                        {prog}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {serverError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                            {serverError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-blue-700 sm:text-sm"
                    >
                        S'inscrire
                    </button>
                </form>
            </div>
        </div>
    );
}