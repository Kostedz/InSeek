import React from "react";
import { Link, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";

function ErrorPage({ error: propError }) {
  const { t } = useTranslation();

  let routeError = null;
  try {
    routeError = useRouteError();
  } catch {
    routeError = null;
  }

  const error = propError || routeError;

  const status =
      error?.status ||
      error?.response?.status ||
      (typeof error === "number" ? error : null) || 500;

  const getErrorContent = (statusCode) => {
    switch (statusCode) {
      case 404:
        return {
          code: "404",
          title: t("errorPage.404.title"),
          description:
              error?.message ||
              t("errorPage.404.description"),
        };
      case 403:
        return {
          code: "403",
          title: t("errorPage.403.title"),
          description:
              error?.message ||
              t("errorPage.403.description"),
        };
      case 500:
        return {
          code: "500",
          title: t("errorPage.500.title"),
          description:
              error?.message ||
              t("errorPage.500.description"),
        };
      default:
        return {
          code: statusCode ? String(statusCode) : t("errorPage.label"),
          title: t("errorPage.title"),
          description:
              error?.message ||
              error?.statusText ||
              t("errorPage.unexpected"),
        };
    }
  };

  const content = getErrorContent(status);

  return (
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="w-full max-w-2xl rounded-[2rem] border border-line bg-surface p-8 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-8">
          <div
              className="flex h-8 w-fit min-w-[4.5rem] items-center justify-center rounded-2xl bg-pink px-3 text-sm font-black text-ink"
              aria-hidden="true"
          >
            {content.code}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-ink-soft">
            {content.description}
          </p>
          <Link
              to="/"
              className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/60"
          >
            {t("errorPage.backHome")}
          </Link>
        </div>
      </section>
  );
}

export default ErrorPage;
