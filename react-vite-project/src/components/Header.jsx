import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Header({user}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const nextLanguage = currentLanguage === "fr" ? "en" : "fr";
    const role = String(user?.role ?? "")
        .replace(/^ROLE_/, "")
        .toUpperCase();
    const isLoggedIn = Boolean(user?.isLoggedIn);
    const isGestionnaire = role === "GESTIONNAIRE";
    const isPrepose = isGestionnaire || role === "PREPOSE";
    const isEmprunteur = isGestionnaire || role === "EMPRUNTEUR";

    const navLinkClass = ({isActive}) => [
        "inline-flex w-full justify-center rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors md:w-auto md:px-3",
        isActive
            ? "bg-pink text-ink"
            : "text-white/80 hover:bg-white/10 hover:text-white"
    ].join(" ");

    const loginLinkClass = ({isActive}) => [
        "inline-flex w-full justify-center rounded-full px-4 py-2 text-center text-sm font-bold transition-colors md:w-auto md:px-3",
        isActive
            ? "bg-pink text-ink"
            : "text-white/85 hover:bg-white/10 hover:text-white"
    ].join(" ");

    const formatRole = (value) => {
        const formatted = String(value ?? "").replace(/^ROLE_/, "").toLowerCase();
        return formatted ? t(`navigation.roles.${formatted}`, { defaultValue: formatted.charAt(0).toUpperCase() + formatted.slice(1) }) : "";
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b-4 border-pink bg-ink text-white shadow-[0_8px_24px_rgba(48,35,55,0.18)]">
            <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
                <Link to="/" className="group -my-1 flex shrink-0 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/10 focus:outline-none" onClick={closeMenu}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lemon text-xl font-black text-ink">
                        I
                    </span>
                    <span>
                        <span className="block text-lg font-black tracking-tight">InSeek</span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{t("brand.tagline")}</span>
                    </span>
                </Link>

                <span className="h-6 w-px bg-white/20" aria-hidden="true" />

                <button
                    type="button"
                    onClick={() => i18n.changeLanguage(nextLanguage)}
                    className="inline-flex shrink-0 justify-center rounded-full border border-white/20 px-3 py-2 text-center text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={t("language.switchAriaLabel")}
                >
                    {t("language.switch")}
                </button>

                <button
                    type="button"
                    className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white transition-colors hover:bg-white/10 md:hidden"
                    aria-controls="site-navigation"
                    aria-expanded={isMenuOpen}
                    aria-label={isMenuOpen ? t("navigation.closeMenu") : t("navigation.openMenu")}
                    onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                >
                    <span className="sr-only">{isMenuOpen ? t("navigation.closeMenu") : t("navigation.openMenu")}</span>
                    {isMenuOpen ? (
                        <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    ) : (
                        <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                <nav
                    id="site-navigation"
                    className={`${isMenuOpen ? "flex" : "hidden"} basis-full flex-col items-stretch gap-3 md:ml-auto md:flex md:basis-auto md:flex-row md:items-center md:gap-2`}
                    aria-label={t("navigation.mainAriaLabel")}
                >
                    <ul className="flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center">
                        <li><NavLink to="/" end className={navLinkClass} onClick={closeMenu}>{t("navigation.home")}</NavLink></li>
                        <li><NavLink to="/about" className={navLinkClass} onClick={closeMenu}>{t("navigation.about")}</NavLink></li>
                        {isEmprunteur && <li><NavLink to="/emprunteur" className={navLinkClass} onClick={closeMenu}>{t("navigation.borrower")}</NavLink></li>}
                        {isPrepose && <li><NavLink to="/prepose" className={navLinkClass} onClick={closeMenu}>{t("navigation.clerk")}</NavLink></li>}
                        {isGestionnaire && <li><NavLink to="/gestionnaire" className={navLinkClass} onClick={closeMenu}>{t("navigation.manager")}</NavLink></li>}
                    </ul>

                    <span className="flex h-6 w-full items-center justify-center md:w-px" aria-hidden="true">
                        <span className="h-px w-12 bg-white/20 md:h-6 md:w-px" />
                    </span>

                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left text-xs md:text-right">
                                <p className="font-bold text-white">{t("navigation.greeting", { firstName: user.firstName, lastName: user.lastName })}</p>
                                {user.role && <p className="text-white/60">{formatRole(user.role)}</p>}
                            </div>
                            <NavLink to="/logout" onClick={closeMenu} className="w-full justify-center rounded-full border border-peach bg-peach px-4 py-2 text-center text-sm font-bold text-ink transition-colors hover:bg-gold md:w-auto">
                                {t("navigation.logout")}
                            </NavLink>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <NavLink to="/login" onClick={closeMenu} className={loginLinkClass}>
                                {t("navigation.login")}
                            </NavLink>
                            <NavLink to="/register" onClick={closeMenu} className="w-full justify-center rounded-full bg-pink px-4 py-2 text-center text-sm font-bold text-ink transition-colors hover:bg-blush md:w-auto">
                                {t("navigation.register")}
                            </NavLink>
                        </div>
                    )}

                </nav>
            </div>
        </header>
    );
}

export default Header;
