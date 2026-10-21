import {Link, useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";

export default function StudentMenu({offersCount, applicationsCount}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const offersActive = pathname === "/" || pathname === "/etudiant/offres";
    const applicationsActive = pathname === "/etudiant/candidatures";

    const countBadge = (count) => count === null || count === undefined ? null : (
        <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">
            {count}
        </span>
    );

    const itemClass = (active) => [
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
        active
            ? "bg-ink text-white shadow-sm"
            : "text-ink-soft hover:bg-lavender/30 hover:text-ink",
    ].join(" ");

    return (
        <nav
            aria-label={t("navigation.studentMenuAriaLabel")}
            className="mt-7 inline-flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)]"
        >
            <Link to="/etudiant/offres" className={itemClass(offersActive)}>
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.offers")}
                    {countBadge(offersCount)}
                </span>
            </Link>
            <Link to="/etudiant/candidatures" className={itemClass(applicationsActive)}>
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.applications")}
                    {countBadge(applicationsCount)}
                </span>
            </Link>
        </nav>
    );
}
