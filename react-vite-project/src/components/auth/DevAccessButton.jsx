import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../utils/api.js";

function DevAccessButton({setUser}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    if (!import.meta.env.DEV) {
        return null;
    }

    const activateDevAccess = async () => {
        setLoading(true);
        setError(false);

        try {
            const loginResponse = await api.auth.devLogin();
            if (!loginResponse.ok) {
                throw new Error("dev_login_failed");
            }

            const loginData = await loginResponse.json();
            const token = loginData.accessToken || loginData.token;
            if (!token) {
                throw new Error("dev_token_missing");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("devAccess", "true");

            const userResponse = await api.auth.getMe();
            if (!userResponse.ok) {
                throw new Error("dev_user_missing");
            }

            const userData = await userResponse.json();
            setUser({...userData, isLoggedIn: true, isDevAccess: true});
            navigate("/", {replace: true});
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("devAccess");
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            {error && (
                <p className="max-w-xs rounded-xl border border-error bg-surface px-3 py-2 text-xs font-semibold text-error shadow-lg"
                   role="alert">
                    {t("devAccess.error")}
                </p>
            )}
            <button
                type="button"
                onClick={activateDevAccess}
                disabled={loading}
                className="whitespace-nowrap rounded-full border border-ink bg-gold px-2.5 py-1.5 text-[11px] font-black text-ink shadow-lg transition-colors hover:bg-lemon focus:outline-none focus:ring-4 focus:ring-pink/60 disabled:cursor-wait disabled:opacity-70"
            >
                {loading ? t("devAccess.loading") : t("devAccess.button")}
            </button>
        </div>
    );
}

export default DevAccessButton;
