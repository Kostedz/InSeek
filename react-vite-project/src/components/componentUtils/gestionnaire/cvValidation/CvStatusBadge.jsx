import {useTranslation} from "react-i18next";

export default function StatusBadge({ status }) {
    const {t} = useTranslation();
    const colors = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
    };

    const labels = {
        EN_ATTENTE: "studentCv.status.pending",
        VALIDE: "studentCv.status.approved",
        REJETE: "studentCv.status.rejected",
    };

    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${colors[status] ?? colors.EN_ATTENTE}`}>
            {t(labels[status] ?? "studentCv.status.none")}
        </span>
    );
}