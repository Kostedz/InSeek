import React from "react";
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

function About() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-10">
        <span className="inline-flex rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("about.label")}</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">InSeek</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-ink-soft">
          {t("about.description")}
        </p>
        <div className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm">
          <span className="font-semibold text-ink-soft">{t("about.version")}</span>
          <Link to='/' className="font-bold text-ink underline decoration-pink decoration-2 underline-offset-4 hover:text-ink-soft">{t("about.backHome")}</Link>
        </div>
      </div>
    </section>
  );

}
export default About;
