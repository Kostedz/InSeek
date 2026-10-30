import {useTranslation} from "react-i18next";

export default function StatusBadge({status}) {
    const {t} = useTranslation();
    const styles = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
    };
    const labelKeys = {
        EN_ATTENTE: "pending",
        VALIDE: "approved",
        REJETE: "rejected",
    };
    const statusKey = status === "VALIDÉ" ? "VALIDE" : status;

    return (
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${styles[statusKey] ?? styles.EN_ATTENTE}`}>
            {labelKeys[statusKey] ? t(`managerValidation.status.${labelKeys[statusKey]}`) : status}
        </span>
    );
}