import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Header({user}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const nextLanguage = currentLanguage === "fr" ? "en" : "fr";
    const role = String(user?.role ?? "")
        .replace(/^ROLE_/, "")
        .toUpperCase();
    const firstName = user?.firstName ?? user?.prenom ?? "";
    const lastName = user?.lastName ?? user?.nom ?? "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ");
    const isLoggedIn = Boolean(user?.isLoggedIn);
    const isGestionnaire = role === "GESTIONNAIRE";
    const isPrepose = isGestionnaire || role === "PREPOSE";
    const isEmprunteur = isGestionnaire || role === "EMPRUNTEUR";

    const navLinkClass = ({isActive}) => [
        "inline-flex w-full justify-center rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors sm:w-auto sm:px-3",
        isActive
            ? "bg-pink text-ink"
            : "text-white/80 hover:bg-white/10 hover:text-white"
    ].join(" ");

    const loginLinkClass = ({isActive}) => [
        "inline-flex w-full justify-center rounded-full px-4 py-2 text-center text-sm font-bold transition-colors sm:w-auto sm:px-3",
        isActive
            ? "bg-pink text-ink"
            : "text-white/85 hover:bg-white/10 hover:text-white"
    ].join(" ");

    useEffect(() => {
        const closeUserMenuOnOutsideClick = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        const closeUserMenuOnEscape = (event) => {
            if (event.key === "Escape") {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeUserMenuOnOutsideClick);
        document.addEventListener("keydown", closeUserMenuOnEscape);

        return () => {
            document.removeEventListener("pointerdown", closeUserMenuOnOutsideClick);
            document.removeEventListener("keydown", closeUserMenuOnEscape);
        };
    }, []);

    const closeMenus = () => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const switchLanguage = () => {
        i18n.changeLanguage(nextLanguage);
        setIsUserMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b-4 border-pink bg-ink text-white shadow-[0_8px_24px_rgba(48,35,55,0.18)]">
            <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
                <Link to="/" className="group -my-1 flex shrink-0 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/10 focus:outline-none" onClick={closeMenus}>
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
                    className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white transition-colors hover:bg-white/10 sm:hidden"
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
                    className={`${isMenuOpen ? "flex" : "hidden"} basis-full flex-col items-stretch gap-3 sm:ml-auto sm:flex sm:basis-auto sm:flex-row sm:items-center sm:gap-2`}
                    aria-label={t("navigation.mainAriaLabel")}
                >
                    <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center">
                        <li><NavLink to="/" end className={navLinkClass} onClick={closeMenus}>{t("navigation.home")}</NavLink></li>
                        <li><NavLink to="/about" className={navLinkClass} onClick={closeMenus}>{t("navigation.about")}</NavLink></li>
                        {isEmprunteur && <li><NavLink to="/emprunteur" className={navLinkClass} onClick={closeMenus}>{t("navigation.borrower")}</NavLink></li>}
                        {isPrepose && <li><NavLink to="/prepose" className={navLinkClass} onClick={closeMenus}>{t("navigation.clerk")}</NavLink></li>}
                        {isGestionnaire && <li><NavLink to="/gestionnaire" className={navLinkClass} onClick={closeMenus}>{t("navigation.manager")}</NavLink></li>}
                    </ul>

                    <span className="flex h-6 w-full items-center justify-center sm:w-px" aria-hidden="true">
                        <span className="h-px w-12 bg-white/20 sm:h-6 sm:w-px" />
                    </span>

                    {isLoggedIn ? (
                        <>
                        <div ref={userMenuRef} className="relative hidden w-full sm:block sm:w-auto">
                            <button
                                type="button"
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-center text-sm font-bold text-white transition-colors ${isUserMenuOpen ? "bg-white/10" : "bg-white/5"} hover:bg-white/10 focus:outline-none sm:w-auto`}
                                aria-haspopup="menu"
                                aria-expanded={isUserMenuOpen}
                                aria-controls="user-menu"
                                aria-label={isUserMenuOpen ? t("navigation.closeUserMenu") : t("navigation.openUserMenu")}
                                onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
                            >
                                <span>{displayName || t("navigation.account")}</span>
                                <svg aria-hidden="true" className={`h-4 w-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>

                            {isUserMenuOpen && (
                                <div id="user-menu" role="menu" className="absolute right-0 top-full z-50 mt-2 flex w-60 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-[1.5rem] border border-ink-soft bg-ink p-3 text-white shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={switchLanguage}
                                        className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-bold text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-pink"
                                        aria-label={t("language.switchAriaLabel")}
                                    >
                                        {t("language.switch")}
                                    </button>
                                    <NavLink
                                        to="/logout"
                                        role="menuitem"
                                        onClick={closeMenus}
                                        className="w-full rounded-xl border border-peach bg-peach px-3 py-2 text-center text-sm font-bold text-ink transition-colors hover:bg-gold focus:outline-none focus:ring-2 focus:ring-peach"
                                    >
                                        {t("navigation.logout")}
                                    </NavLink>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 sm:hidden">
                            <div className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-bold text-white">
                                <span>{displayName || t("navigation.account")}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    switchLanguage();
                                    setIsMenuOpen(false);
                                }}
                                className="inline-flex w-full justify-center rounded-full border border-white/20 px-3 py-2 text-center text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label={t("language.switchAriaLabel")}
                            >
                                {t("language.switch")}
                            </button>
                            <NavLink
                                to="/logout"
                                onClick={closeMenus}
                                className="w-full justify-center rounded-full border border-peach bg-peach px-4 py-2 text-center text-sm font-bold text-ink transition-colors hover:bg-gold"
                            >
                                {t("navigation.logout")}
                            </NavLink>
                        </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    switchLanguage();
                                    setIsMenuOpen(false);
                                }}
                                className="inline-flex w-full justify-center rounded-full border border-white/20 px-3 py-2 text-center text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
                                aria-label={t("language.switchAriaLabel")}
                            >
                                {t("language.switch")}
                            </button>
                            <NavLink to="/login" onClick={closeMenus} className={loginLinkClass}>
                                {t("navigation.login")}
                            </NavLink>
                            <NavLink to="/register" onClick={closeMenus} className="w-full justify-center rounded-full bg-pink px-4 py-2 text-center text-sm font-bold text-ink transition-colors hover:bg-blush sm:w-auto">
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
