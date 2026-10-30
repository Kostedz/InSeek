import {useTranslation} from "react-i18next";
import {translateMessage} from "../../../../utils/i18nMessage.js";
import React from "react";

export function StatusBadge({status}) {
    const {t} = useTranslation();
    const styles = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
        NOT_SUBMITTED: "border-line bg-canvas text-ink-soft",
    };
    const labels = {
        EN_ATTENTE: t("employerOffers.status.pending"),
        VALIDE: t("employerOffers.status.published"),
        REJETE: t("employerOffers.status.rejected"),
        NOT_SUBMITTED: t("employerOffers.status.draft"),
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] ?? styles.NOT_SUBMITTED}`}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"/>
            {labels[status] ?? status}
        </span>
    );
}

export function Field({id, label, required = false, error, className = "", children}) {
    const {t} = useTranslation();

    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
                {label} {required && <span className="text-error" aria-hidden="true">*</span>}
            </label>
            {children}
            {error &&
                <p className="mt-1.5 text-xs font-semibold text-error" role="alert">{translateMessage(t, error)}</p>}
        </div>
    );
}

export function inputClass(error, disabled = false) {
    return `w-full rounded-xl border bg-canvas px-3.5 py-3 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-pink/40 ${
        error ? "border-error" : "border-line"
    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;
}