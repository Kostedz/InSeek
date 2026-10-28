import PdfPreview from "../../../PdfPreview.jsx";
import React from "react";
import {useTranslation} from "react-i18next";
import Icon from "./Icon.jsx";


export function ApplicationDocument({icon, label, fileName, documentId, t}) {
    return (
        <div className="rounded-2xl border border-line bg-canvas p-4">
            <div className="flex items-start gap-3">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender/45 text-ink">
                    <Icon name={icon} className="h-5 w-5"/>
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-black text-ink">{label}</p>
                    <p className="mt-1 truncate text-xs text-ink-soft">{fileName || t("employerOffers.applications.documentUnavailable")}</p>
                </div>
            </div>
            {documentId && <PdfPreview documentId={documentId} fileName={fileName} className="mt-4"/>}
        </div>
    );
}

export function ApplicationStatusBadge({status}) {
    const {t} = useTranslation();

    if (status === "ACCEPTED") {
        return (
            <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                {t("employerOffers.applications.status.accepted", "Acceptée")}
            </span>
        );
    }
    if (status === "REJECTED") {
        return (
            <span className="inline-flex shrink-0 items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                {t("employerOffers.applications.status.rejected", "Refusée")}
            </span>
        );
    }
    return (
        <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            {t("employerOffers.applications.status.pending", "En attente")}
        </span>
    );
}