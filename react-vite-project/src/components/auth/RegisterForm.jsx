import React, {useState} from "react";

export default function RegisterForm() {
    const [role,setRole] = useState("etudiant");

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
                    Créer un compte
                </h2>

                <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => setRole('etudiant')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                            role === 'etudiant'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Étudiant
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('professeur')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                            role === 'professeur'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Professeur
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('employeur')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                            role === 'employeur'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Employeur
                    </button>
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Adresse courriel
                        </label>
                        <input
                            type="email"
                            placeholder="nom@exemple.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        S'inscrire
                    </button>
                </form>
            </div>
        </div>
    );
}