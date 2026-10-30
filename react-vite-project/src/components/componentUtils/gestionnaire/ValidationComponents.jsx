import {hasValue} from "./validationUtils.js";

export function InfoItem({label, value}) {
    if (!hasValue(value)) return null;

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-1 text-sm text-ink">{value}</p>
        </div>
    );
}