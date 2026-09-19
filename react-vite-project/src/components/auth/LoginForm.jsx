import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import fetcher from "../../utils/fetcher";
import { useTranslation } from "react-i18next";

const LoginForm = ({user, setError}) => {
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

  const validateEmail = () => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(formData.email);
  };

  const validatePassword = () => true;

  const validateUser = () => {
    const updatedWarnings = {
      email: validateEmail() ? "" : t("auth.login.invalidEmail"),
      password: validatePassword() ? "" : t("auth.login.invalidPassword")
    };
    setWarnings(updatedWarnings);
    return !updatedWarnings.email && !updatedWarnings.password;
  };

  const handleChanges = (e) => {
    const {name, value} = e.target;
    setWarnings({...warnings, [name]: ""});
    setFormData({...formData, [name]: value.trim()});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateUser()) fetchFunc();
  };

  const fetchFunc = async () => {
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
          case 401:
            throw new Error(t("errors.unauthorized"));
          case 404:
            throw new Error(t("errors.serverUnavailable"));
          default:
            throw new Error(t("errors.requestFailedGeneric"));
        }
      }

      const data = await response.json();
      localStorage.setItem('token', data.accessToken);

      const userResponse = await fetcher('user/me', {});
      if (!userResponse.ok) throw new Error(t("errors.requestFailed"));

      const userData = await userResponse.json();
      const role = userData.role;
      if (role === "ROLE_EMPRUNTEUR") navigate("/emprunteur");
      else if (role === "ROLE_PREPOSE") navigate("/prepose");
      else if (role === "ROLE_GESTIONNAIRE") navigate("/gestionnaire");
      else navigate("/");
    } catch(error) {
      setError(error);
      navigate('/error');
    }
  };

  return (
    <>
      {user?.isLoggedIn ? (
        user.role === "ROLE_EMPRUNTEUR" ? navigate("/emprunteur") :
          user.role === "ROLE_PREPOSE" ? navigate("/prepose") :
            user.role === "ROLE_GESTIONNAIRE" ? navigate("/gestionnaire") :
              navigate("/")
      ) : (
        <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
          <div className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-10">
            <div className="mb-8">
              <span className="inline-flex rounded-full bg-lavender px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("auth.memberArea")}</span>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-ink">{t("auth.login.welcomeBack")}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{t("auth.login.description")}</p>
            </div>

            <form id="login-form" className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-ink">{t("auth.login.email")}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-4 focus:ring-pink/40 ${warnings.email ? "border-error" : "border-line focus:border-lavender"}`}
                  placeholder={t("auth.login.emailPlaceholder")}
                  name="email"
                  onChange={handleChanges}
                  aria-invalid={Boolean(warnings.email)}
                  required
                />
                {warnings.email && <p className="mt-2 text-sm font-medium text-error">{warnings.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink">{t("auth.login.password")}</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-4 focus:ring-pink/40 ${warnings.password ? "border-error" : "border-line focus:border-lavender"}`}
                  placeholder="••••••••"
                  name="password"
                  onChange={handleChanges}
                  aria-invalid={Boolean(warnings.password)}
                  required
                />
                {warnings.password && <p className="mt-2 text-sm font-medium text-error">{warnings.password}</p>}
              </div>

              <button type="submit" className="w-full rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50">
                {t("auth.login.submit")}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-ink-soft">
              {t("auth.login.noAccount")} <Link to="/register" className="font-bold text-ink underline decoration-pink decoration-2 underline-offset-4 hover:text-ink-soft">{t("auth.login.createAccount")}</Link>
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default LoginForm;
