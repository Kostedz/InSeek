import { useState } from "react";
import { useTranslation } from "react-i18next";
import {api} from "../../../utils/api.js";
import {notifyStudentTabCountsChanged} from "../../../utils/tabCounts.js";

export default function ApplyButton({ offerId, initialApplied = false, onAppliedSuccess }) {
    const { t } = useTranslation();
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(initialApplied);
    const [errorMsg, setErrorMsg] = useState("");

    const handleApply = async (e) => {
        e.stopPropagation();
        setApplying(true);
        setErrorMsg("");

        try {
            const response = await api.student.applyToOffer(offerId);

            if (!response.ok) {
                if (response.status === 400 || response.status === 409) {
                    setHasApplied(true);
                    setErrorMsg(t("studentOffers.application.errors.alreadySubmitted"));
                    return;
                }
                throw new Error("apply_failed");
            }

            setHasApplied(true);
            notifyStudentTabCountsChanged();
            if (onAppliedSuccess) {
                onAppliedSuccess(offerId);
            }
        } catch {
            setErrorMsg(t("errors.requestFailedGeneric"));
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                disabled={applying || hasApplied}
                onClick={handleApply}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    hasApplied
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-ink text-white hover:bg-ink-soft disabled:opacity-50"
                }`}
            >
                {hasApplied
                    ? t("studentOffers.application.alreadySubmittedButton")
                    : applying
                        ? t("studentOffers.application.submitting")
                        : t("studentOffers.application.apply")}
            </button>

            {errorMsg && (
                <span className="text-xs font-medium text-error">{errorMsg}</span>
            )}
        </div>
    );
}
