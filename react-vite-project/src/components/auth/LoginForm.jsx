import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import fetcher from "../../utils/fetcher";
import { useTranslation } from "react-i18next";
import Loading from "../Loading.jsx";

const LoginForm = ({ user, authChecked, setUser }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [warnings, setWarnings] = useState({
    email: '',
    password: ''
  });

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (emailVal) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(emailVal);
  };

  const handleChanges = (e) => {
    const { name, value } = e.target;
    setApiError("");

    const trimmedValue = value.trim();
    setFormData({ ...formData, [name]: trimmedValue });

    if (name === "email") {
      if (trimmedValue && !validateEmail(trimmedValue)) {
        setWarnings(prev => ({
          ...prev,
          email: t("auth.login.invalidEmail", "Format d'adresse courriel invalide (ex: exemple@domaine.com)")
        }));
      } else {
        setWarnings(prev => ({ ...prev, email: "" }));
      }
    } else {
      setWarnings(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateEmail(formData.email)) {
      setWarnings(prev => ({
        ...prev,
        email: t("auth.login.invalidEmail", "Format d'adresse courriel invalide (ex: exemple@domaine.com)")
      }));
      return;
    }

    fetchFunc();
  };

  const fetchFunc = async () => {
    setLoading(true);
    try {
      const response = await fetcher('/user/login', {
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
          case 400:
          case 401:
          case 404:
            setApiError(t("auth.login.invalidCredentials", "Courriel ou mot de passe incorrect."));
            break;
          case 403:
            setApiError(t("auth.login.forbidden", "Votre compte n'a pas les autorisations requises."));
            break;
          case 500:
          default:
            setApiError(t("errors.serverUnavailable", "Serveur non disponible. Veuillez réessayer plus tard."));
            break;
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem('token', data.accessToken || data.token);

      const userResponse = await fetcher('user/me', {});
      if (!userResponse.ok) {
        setApiError(t("errors.serverUnavailable", "Serveur non disponible. Impossible d'extraire la session."));
        setLoading(false);
        return;
      }

      const userData = await userResponse.json();

      if (setUser) {
        setUser({ ...userData, isLoggedIn: true });
      }

      const role = userData.role;
      if (role === "ROLE_EMPRUNTEUR") navigate("/emprunteur");
      else if (role === "ROLE_PREPOSE") navigate("/prepose");
      else if (role === "ROLE_GESTIONNAIRE") navigate("/gestionnaire");
      else navigate("/");

    } catch (error) {
      console.error("Login Error:", error);
      setApiError(t("errors.serverUnavailable", "Serveur non disponible. Veuillez vérifier votre connexion."));
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        {!authChecked ? (
            <Loading />
        ) : user?.isLoggedIn ? (
            <Navigate to="/" replace state={{ authNotice: true }} />
        ) : (
            <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
              <div className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-10">
                <div className="mb-8">
              <span className="inline-flex rounded-full bg-lavender px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                {t("auth.memberArea")}
              </span>
                  <h1 className="mt-5 text-3xl font-black tracking-tight text-ink">
                    {t("auth.login.welcomeBack")}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    {t("auth.login.description")}
                  </p>
                </div>

                {apiError && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {apiError}
                    </div>
                )}

                <form id="login-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-bold text-ink">
                      {t("auth.login.email")}
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={`w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-4 focus:ring-pink/40 ${
                            warnings.email ? "border-red-500 focus:border-red-500" : "border-line focus:border-lavender"
                        }`}
                        placeholder={t("auth.login.emailPlaceholder")}
                        name="email"
                        value={formData.email}
                        onChange={handleChanges}
                        aria-invalid={Boolean(warnings.email)}
                        required
                    />
                    {warnings.email && (
                        <p className="mt-2 text-sm font-medium text-red-600">{warnings.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink">
                      {t("auth.login.password")}
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        className={`w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-4 focus:ring-pink/40 ${
                            warnings.password ? "border-red-500 focus:border-red-500" : "border-line focus:border-lavender"
                        }`}
                        placeholder="••••••••"
                        name="password"
                        value={formData.password}
                        onChange={handleChanges}
                        aria-invalid={Boolean(warnings.password)}
                        required
                    />
                    {warnings.password && (
                        <p className="mt-2 text-sm font-medium text-red-600">{warnings.password}</p>
                    )}
                  </div>

                  <button
                      type="submit"
                      disabled={loading || Boolean(warnings.email)}
                      className="w-full rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:opacity-50"
                  >
                    {loading ? t("auth.login.loading", "Connexion en cours...") : t("auth.login.submit")}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-ink-soft">
                  {t("auth.login.noAccount")}{" "}
                  <Link
                      to="/register"
                      className="font-bold text-ink underline decoration-pink decoration-2 underline-offset-4 hover:text-ink-soft"
                  >
                    {t("auth.login.createAccount")}
                  </Link>
                </p>
              </div>
            </section>
        )}
      </>
  );
};

export default LoginForm;