import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../utils/api.js";
import { FormValidator } from "../../utils/formValidator.js";
import Loading from "../Loading.jsx";
import {translateMessage} from "../../utils/i18nMessage.js";

const LoginForm = ({ user, authChecked, setUser }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [warnings, setWarnings] = useState({
    email: "",
    password: ""
  });

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChanges = (e) => {
    const { name, value } = e.target;
    setApiError("");

    const trimmedValue = value.trim();
    setFormData((prev) => ({ ...prev, [name]: trimmedValue }));

    if (name === "email") {
      if (trimmedValue && !FormValidator.REGEX.email.test(trimmedValue)) {
        setWarnings((prev) => ({
          ...prev,
          email: "auth.login.invalidEmail"
        }));
      } else {
        setWarnings((prev) => ({ ...prev, email: "" }));
      }
    } else {
      setWarnings((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getRedirectPathByRole = (role) => {
    const normalizedRole = String(role ?? "").replace(/^ROLE_/, "").toUpperCase();

    switch (normalizedRole) {
      case "GESTIONNAIRE":
        return "/gestionnaire";
      case "ETUDIANT":
        return "/etudiant";
      case "EMPLOYEUR":
        return "/employeur";
      default:
        return "/";
    }
  };

  const fetchFunc = async () => {
    setLoading(true);
    try {
      const response = await api.auth.login({
        email: formData.email.toLowerCase(),
        password: formData.password
      });

      if (!response.ok) {
        switch (response.status) {
          case 400:
          case 401:
          case 404:
            setApiError("auth.login.invalidCredentials");
            break;
          case 403:
            setApiError("auth.login.forbidden");
            break;
          case 500:
          default:
            setApiError("errors.serverUnavailable");
            break;
        }
        return;
      }

      const data = await response.json();
      localStorage.setItem("token", data.accessToken || data.token);

      const userResponse = await api.auth.getMe();
      if (!userResponse.ok) {
        setApiError("errors.serverUnavailable");
        return;
      }

      const userData = await userResponse.json();

      if (setUser) {
        setUser({ ...userData, isLoggedIn: true });
      }

      navigate(getRedirectPathByRole(userData.role));
    } catch (error) {
      console.error("Login Error:", error);
      setApiError("errors.serverUnavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError("");

    if (!FormValidator.REGEX.email.test(formData.email)) {
      setWarnings((prev) => ({
        ...prev,
        email: "auth.login.invalidEmail"
      }));
      return;
    }

    fetchFunc();
  };

  if (!authChecked) {
    return <Loading />;
  }

  if (user?.isLoggedIn) {
    return <Navigate to="/" replace/>;
  }

  return (
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
                      {translateMessage(t, apiError)}
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
                        <p className="mt-2 text-sm font-medium text-red-600">{translateMessage(t, warnings.email)}</p>
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
                        <p className="mt-2 text-sm font-medium text-red-600">{translateMessage(t, warnings.password)}</p>
                    )}
                  </div>

            <button
                type="submit"
                disabled={loading || Boolean(warnings.email)}
                className="w-full rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:opacity-50"
            >
              {loading ? t("auth.login.loading") : t("auth.login.submit")}
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
  );
};

export default LoginForm;
