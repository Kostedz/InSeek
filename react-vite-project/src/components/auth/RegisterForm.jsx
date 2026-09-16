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
        programme: "Informatique",
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const programmes = [
        "Informatique",
        "Tech. Infirmière",
        "Architecture",
        "Gestion de commerce",
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const payload = {
            prenom: formData.prenom,
            nom: formData.nom,
            email: formData.email.toLowerCase(),
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
                    case 401:
                        throw new Error("Not authorized");
                    case 404:
                        throw new Error("No server available");
                    default:
                        throw new Error("Not ok");
                }
            }

            const data = await response.json();
            localStorage.setItem("token", data.accessToken);

            const userResponse = await fetcher("user/me", {});
            if (!userResponse.ok) {
                throw new Error("Failed to fetch user info");
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
            setError(err.message);
            navigate("/error");
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
                            { id: "etudiant", label: "Employeur" },
                            { id: "professeur", label: "Étudiant" },
                            { id: "employeur", label: "Professeur" },
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

                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Prénom</label>
                        <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                            placeholder="Pascal"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Nom</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                            placeholder="Dupont"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
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
                            required
                            placeholder="nom@exemple.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none sm:py-2 sm:text-sm"
                        />
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
                            required
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none sm:py-2 sm:text-sm"
                        />
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

                    {error && <p className="text-sm text-red-600">{error}</p>}

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

