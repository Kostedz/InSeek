import React, {useState} from "react";
import fetcher from "../../utils/fetcher.js";

const fetchFunc = async () => {
    try {
        const response = await fetcher('/user/register', {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify({
                email: formData.email.toLowerCase(),
                password: formData.password
            }),
        });
        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new Error("Not authorized");
                    break;
                case 404:
                    throw new Error("No server available");
                default:
                    throw new Error("Not ok")
            }
        }
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);

        // Fetch user info to get role
        const userResponse = await fetcher('user/me', {});
        if (!userResponse.ok) {
            throw new Error("Failed to fetch user info");
        }
        const userData = await userResponse.json();

        // Navigate to role-specific page
        const role = userData.role;
        if (role === "ROLE_EMPRUNTEUR") {
            navigate("/emprunteur");
        } else if (role === "ROLE_PREPOSE") {
            navigate("/prepose");
        } else if (role === "ROLE_GESTIONNAIRE") {
            navigate("/gestionnaire");
        } else {
            navigate("/");
        }
    } catch(error) {
        setError(error)
        navigate('/error')
    }


}

export default function RegisterForm() {
    const [role, setRole] = useState("etudiant");

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md sm:max-w-md sm:p-8 md:max-w-lg">
                <h2 className="mb-5 text-center text-xl font-bold text-gray-800 sm:mb-6 sm:text-2xl">
                    Créer un compte
                </h2>

                <div className="mb-5 sm:mb-6">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                        {[
                            {id: 'etudiant', label: 'Employeur'},
                            {id: 'professeur', label: 'Étudiant'},
                            {id: 'employeur', label: 'Professeur'},
                        ].map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setRole(option.id)}
                                aria-pressed={role === option.id}
                                className={`flex items-center justify-center rounded-xl border p-2 text-center transition-all sm:flex-col sm:gap-1 sm:p-3 ${
                                    role === option.id
                                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <span
                                    className={`text-sm font-medium ${
                                        role === option.id ? 'text-white' : 'text-gray-700'
                                    }`}
                                >
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <form className="space-y-4 sm:space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Adresse courriel
                        </label>
                        <input
                            type="email"
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
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none sm:py-2 sm:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white text-center transition-colors hover:bg-blue-700 sm:text-sm"
                    >
                        S'inscrire
                    </button>
                </form>
            </div>
        </div>
    );
}