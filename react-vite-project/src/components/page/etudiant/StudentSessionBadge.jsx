import {useTranslation} from "react-i18next";

export function formatStudentSession(session, t) {
    const match = String(session).trim().match(/^([AHE])(\d{2})$/i);
    if (!match) return session;

    const seasonKey = {
        A: "autumn",
        H: "winter",
        E: "summer",
    }[match[1].toUpperCase()];

    return `${t(`studentOffers.seasons.${seasonKey}`)} 20${match[2]}`;
}

export default function StudentSessionBadge({session}) {
    const {t} = useTranslation();

    if (!session) return null;

    return (
        <span
            className="inline-flex shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold tracking-wide text-ink-soft">
            {t("studentOffers.sessionLabel")} {formatStudentSession(session, t)}
        </span>
    );
}
