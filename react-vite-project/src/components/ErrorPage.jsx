import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function ErrorPage({error}) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="w-full max-w-2xl rounded-[2rem] border border-line bg-surface p-8 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-8">
        <div className="flex h-8 w-18 items-center justify-center rounded-2xl bg-pink text-l font-black text-ink" aria-hidden="true">
          {t("errorPage.label")}
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t("errorPage.title")}</h1>
        <p className="mt-4 max-w-xl leading-7 text-ink-soft">
          {error?.message || t("errorPage.unexpected")}
        </p>
        <Link to="/" className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/60">
          {t("errorPage.backHome")}
        </Link>
      </div>
    </section>
  );
}

export default ErrorPage;
