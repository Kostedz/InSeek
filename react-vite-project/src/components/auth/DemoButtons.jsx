import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../utils/api.js";
import {getRedirectPathByRole} from "../../utils/authRedirect.js";

const demoRoles = [
    {value: "ETUDIANT", label: "student", color: "bg-lavender hover:bg-lavender"},
    {value: "PROFESSEUR", label: "professor", color: "bg-pink hover:bg-pink"},
    {value: "EMPLOYEUR", label: "employer", color: "bg-peach hover:bg-peach"},
    {value: "GESTIONNAIRE", label: "manager", color: "bg-gold hover:bg-gold"},
];

function DemoButtons({setUser}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [loadingRole, setLoadingRole] = useState(null);
    const [error, setError] = useState(false);

    if (!import.meta.env.DEV) {
        return null;
    }

    const activateDemoAccess = async (demoRole) => {
        setLoadingRole(demoRole.value);
        setError(false);

        try {
            const loginResponse = await api.auth.devLogin(demoRole.value);
            if (!loginResponse.ok) {
                throw new Error("demo_login_failed");
            }

            const loginData = await loginResponse.json();
            const token = loginData.accessToken || loginData.token;
            if (!token) {
                throw new Error("demo_token_missing");
            }

            localStorage.setItem("token", token);
            localStorage.removeItem("devAccess");

            const userResponse = await api.auth.getMe();
            if (!userResponse.ok) {
                throw new Error("demo_user_missing");
            }

            const userData = await userResponse.json();
            setUser({...userData, isLoggedIn: true, isDevAccess: false});
            navigate(await getRedirectPathByRole(userData.role ?? demoRole.value), {replace: true});
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("devAccess");
            setError(true);
        } finally {
            setLoadingRole(null);
        }
    };

    return (
        <div className="flex max-w-[calc(100vw-9rem)] flex-col items-end gap-1" aria-label={t("demoButtons.title")}>
            {error && (
                <p className="max-w-52 rounded-xl border border-error bg-surface px-3 py-2 text-right text-xs font-semibold text-error shadow-lg"
                   role="alert">
                    {t("demoButtons.error")}
                </p>
            )}
            <div className="flex flex-nowrap gap-1">
                {demoRoles.map((demoRole) => (
                    <button
                        key={demoRole.value}
                        type="button"
                        onClick={() => activateDemoAccess(demoRole)}
                        disabled={loadingRole !== null}
                        className={`whitespace-nowrap rounded-full border border-ink px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-lg transition-colors ${demoRole.color} disabled:cursor-wait disabled:opacity-70`}
                    >
                        {loadingRole === demoRole.value ? t("demoButtons.loading") : t(`demoButtons.roles.${demoRole.label}`)}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default DemoButtons;
