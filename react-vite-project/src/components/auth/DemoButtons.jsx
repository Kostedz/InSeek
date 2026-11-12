import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../utils/api.js";
import {getRedirectPathByRole} from "../../utils/authRedirect.js";
import {clearDemoContracts} from "../page/ContractSignaturePage.jsx";

const DELAYED_NOTIFICATIONS_DEMO_KEY = "inseek.delayed-notifications-demo.started";

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
    const [hiddenScenarios, setHiddenScenarios] = useState({});

    if (!import.meta.env.DEV) {
        return null;
    }

    const activateDemoAccess = async (demoRole) => {
        setLoadingRole(demoRole.value);
        setError(false);
        setUser(null);
        navigate("/login", {replace: true});

        try {
            const loginResponse = await api.auth.demoLogin(demoRole.value);
            if (!loginResponse.ok) {
                throw new Error("demo_login_failed");
            }

            const loginData = await loginResponse.json();
            const token = loginData.accessToken || loginData.token;
            if (!token) {
                throw new Error("demo_token_missing");
            }

            localStorage.setItem("token", token);

            const userResponse = await api.auth.getMe();
            if (!userResponse.ok) {
                throw new Error("demo_user_missing");
            }

            const userData = await userResponse.json();
            if (demoRole.value === "ETUDIANT") clearDemoContracts();
            setUser({...userData, isLoggedIn: true});
            navigate(await getRedirectPathByRole(userData.role ?? demoRole.value), {replace: true});
        } catch {
            localStorage.removeItem("token");
            setError(true);
        } finally {
            setLoadingRole(null);
        }
    };

    const activateStudentScenario = async () => {
        setHiddenScenarios((current) => ({...current, student: true}));
        setLoadingRole("STUDENT_SCENARIO");
        setError(false);
        setUser(null);
        navigate("/login", {replace: true});

        try {
            const loginResponse = await api.auth.prepareStudentDemo();
            if (!loginResponse.ok) {
                throw new Error("student_demo_failed");
            }

            const loginData = await loginResponse.json();
            const token = loginData.accessToken || loginData.token;
            if (!token) {
                throw new Error("student_demo_token_missing");
            }

            localStorage.setItem("token", token);

            const userResponse = await api.auth.getMe();
            if (!userResponse.ok) {
                throw new Error("student_demo_user_missing");
            }

            const userData = await userResponse.json();
            clearDemoContracts();
            setUser({...userData, isLoggedIn: true});
            navigate("/", {replace: true});
        } catch {
            localStorage.removeItem("token");
            setHiddenScenarios((current) => ({...current, student: false}));
            setError(true);
        } finally {
            setLoadingRole(null);
        }
    };

    const activateStudentContractScenario = async () => {
        setHiddenScenarios((current) => ({...current, studentContract: true}));
        setLoadingRole("STUDENT_CONTRACT_SCENARIO");
        setError(false);
        setUser(null);
        navigate("/login", {replace: true});

        try {
            const loginResponse = await api.auth.prepareStudentContractDemo();
            if (!loginResponse.ok) throw new Error("student_contract_demo_failed");
            const loginData = await loginResponse.json();
            const token = loginData.accessToken || loginData.token;
            if (!token) throw new Error("student_contract_demo_token_missing");

            localStorage.setItem("token", token);
            const userResponse = await api.auth.getMe();
            if (!userResponse.ok) throw new Error("student_contract_demo_user_missing");
            const userData = await userResponse.json();
            clearDemoContracts();
            setUser({...userData, isLoggedIn: true});
            navigate("/", {replace: true});
        } catch {
            localStorage.removeItem("token");
            setHiddenScenarios((current) => ({...current, studentContract: false}));
            setError(true);
        } finally {
            setLoadingRole(null);
        }
    };

    const activateDelayedNotificationsScenario = async () => {
        setLoadingRole("GESTIONNAIRE");
        setError(false);
        setUser(null);
        navigate("/login", {replace: true});

        try {
            const loginResponse = await api.auth.prepareDelayedNotificationsDemo();
            if (!loginResponse.ok) throw new Error("delayed_notifications_demo_failed");
            const loginData = await loginResponse.json();
            const token = loginData.accessToken || loginData.token;
            if (!token) throw new Error("delayed_notifications_demo_token_missing");

            localStorage.setItem("token", token);
            const userResponse = await api.auth.getMe();
            if (!userResponse.ok) throw new Error("delayed_notifications_demo_user_missing");
            const userData = await userResponse.json();
            localStorage.setItem(DELAYED_NOTIFICATIONS_DEMO_KEY, "true");
            setUser({...userData, isLoggedIn: true});
            navigate("/gestionnaire", {replace: true});
        } catch {
            localStorage.removeItem("token");
            setError(true);
        } finally {
            setLoadingRole(null);
        }
    };

    const activateGestionnaireDemo = () => {
        if (localStorage.getItem(DELAYED_NOTIFICATIONS_DEMO_KEY) === "true") {
            return activateDemoAccess({value: "GESTIONNAIRE"});
        }
        return activateDelayedNotificationsScenario();
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
                        onClick={() => demoRole.value === "GESTIONNAIRE"
                            ? activateGestionnaireDemo()
                            : activateDemoAccess(demoRole)}
                        disabled={loadingRole !== null}
                        className={`whitespace-nowrap rounded-full border border-ink px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-lg transition-colors ${demoRole.color} disabled:cursor-wait disabled:opacity-70`}
                    >
                        {loadingRole === demoRole.value ? t("demoButtons.loading") : t(`demoButtons.roles.${demoRole.label}`)}
                    </button>
                ))}
                {!hiddenScenarios.student && <button
                    type="button"
                    onClick={activateStudentScenario}
                    disabled={loadingRole !== null}
                    className="whitespace-nowrap rounded-full border border-ink bg-lavender px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-lg transition-colors hover:bg-lavender disabled:cursor-wait disabled:opacity-70"
                >
                    {loadingRole === "STUDENT_SCENARIO" ? t("demoButtons.loading") : t("demoButtons.studentScenario")}
                </button>}
                {!hiddenScenarios.studentContract && <button
                    type="button"
                    onClick={activateStudentContractScenario}
                    disabled={loadingRole !== null}
                    className="whitespace-nowrap rounded-full border border-ink bg-lavender px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-lg transition-colors hover:bg-lavender disabled:cursor-wait disabled:opacity-70"
                >
                    {loadingRole === "STUDENT_CONTRACT_SCENARIO" ? t("demoButtons.loading") : t("demoButtons.studentContractScenario")}
                </button>}
            </div>
        </div>
    );
}

export default DemoButtons;
