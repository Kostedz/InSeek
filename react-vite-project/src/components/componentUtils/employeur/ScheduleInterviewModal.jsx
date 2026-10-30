import {useEffect, useRef, useState} from "react";
import { useTranslation } from "react-i18next";
import {api} from "../../../utils/api.js";
import {translateMessage} from "../../../utils/i18nMessage.js";

const DEFAULT_FORM_STATE = {date: "", heure: "", mode: "VIDEO_CALL", lieuOuLien: "", message: ""};
const MAX_LOCATION_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 500;

const getTodayIso = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const getCurrentTimeIso = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

function normalizeFormData(data) {
    const source = data ?? {};
    let mode = source.mode ?? DEFAULT_FORM_STATE.mode;
    if (mode === "EN_PERSONNE") mode = "IN_PERSON";
    if (mode === "VISIOCONFERENCE") mode = "VIDEO_CALL";
    return {
        date: source.date ?? "",
        heure: source.heure ?? "",
        mode,
        lieuOuLien: source.lieuOuLien ?? "",
        message: source.message ?? "",
    };
}

function isValidMeetingLink(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
    } catch {
        return false;
    }
}

function looksLikeLink(value) {
    return /^(https?:\/\/|www\.)/i.test(value.trim());
}

function isValidCanadianAddress(value) {
    const streetTypes = "rue|ruelle|avenue|av\.?|boulevard|boul\.?|chemin|ch\.?|route|rte\.?|rang|montée|mont\.?|place|pl\.?|square|voie|street|st\.?|ave\.?|blvd\.?|road|rd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|crescent|cr\.?|way|highway|hwy\.?|trail";
    const streetWord = "[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9.'’\\-]*";
    const streetName = `${streetWord}(?:\\s+${streetWord})*`;
    const civicNumber = "\\d+[A-Za-z]?(?:[-/]\\d+[A-Za-z]?)?";
    const addressPattern = new RegExp(
        `^\\s*${civicNumber}\\s+(?:(?:${streetTypes})\\s+${streetName}|${streetName}\\s+(?:${streetTypes}))(?:\\s*,?\\s+.+)?\\s*$`,
        "i"
    );

    return addressPattern.test(value.trim());
}

async function getResponseError(response, fallback) {
    const body = await response.text().catch(() => "");
    if (!body.trim()) return fallback;

    try {
        const parsed = JSON.parse(body);
        if (typeof parsed === "string") return parsed;
        return parsed?.messageKey || parsed?.message || body;
    } catch {
        return body;
    }
}

function InterviewIcon({name, className = "h-5 w-5"}) {
    const paths = {
        calendar: <>
            <rect x="3" y="4.5" width="18" height="17" rx="2"/>
            <path d="M16 2.5v4M8 2.5v4M3 9h18"/>
        </>,
        clock: <>
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 2"/>
        </>,
        video: <>
            <rect x="3" y="6" width="13" height="12" rx="2"/>
            <path d="m16 10 5-3v10l-5-3"/>
        </>,
        location: <>
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/>
            <circle cx="12" cy="10" r="2.5"/>
        </>,
        message: <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2 1.5-4A7.5 7.5 0 1 1 20 11.5Z"/>,
        check: <path d="m5 12 4 4L19 6"/>,
        close: <path d="M6 6l12 12M18 6 6 18"/>,
        alert: <>
            <path d="M12 3 2.7 20h18.6L12 3Z"/>
            <path d="M12 9v4M12 16h.01"/>
        </>,
    };
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function FieldLabel({htmlFor, children, required = false}) {
    return <label htmlFor={htmlFor}
                  className="flex items-center gap-1 text-sm font-bold text-ink">{children}{required &&
        <span className="text-error" aria-hidden="true">*</span>}</label>;
}

function FieldError({id, children}) {
    if (!children) return null;
    return <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-error" role="alert">
        <InterviewIcon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0"/><span>{children}</span></p>;
}

function fieldClass(hasError) {
    return `mt-2 w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/70 focus:ring-4 focus:ring-pink/40 ${hasError ? "border-error focus:border-error" : "border-line focus:border-lavender"}`;
}

export default function ScheduleInterviewModal({ offerId, candidat, initialData, onClose, onSuccess }) {
    const { t } = useTranslation();
    const [isEdit, setIsEdit] = useState(Boolean(candidat?.isEdit));
    const [submittedData, setSubmittedData] = useState(null);
    const storageKey = `interview_draft_${offerId}_${candidat?.id}`;
    const [formData, setFormData] = useState(() => {
        const savedDraft = sessionStorage.getItem(storageKey);
        if (savedDraft) {
            try {
                return normalizeFormData(JSON.parse(savedDraft));
            } catch {
                sessionStorage.removeItem(storageKey);
            }
        }
        return normalizeFormData(initialData ?? DEFAULT_FORM_STATE);
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const contentRef = useRef(null);

    const today = getTodayIso();
    const timeMin = formData.date === today ? getCurrentTimeIso() : undefined;
    const isVideoCall = formData.mode === "VIDEO_CALL";
    const candidateName = [candidat?.prenom ?? candidat?.firstName, candidat?.nom ?? candidat?.lastName].filter(Boolean).join(" ") || candidat?.name || t("employerOffers.interviews.unknownCandidate", "Candidat");

    const scrollToError = () => {
        contentRef.current?.scrollTo?.({top: 0, behavior: "smooth"});
    };

    useEffect(() => {
        if (!isSuccess) sessionStorage.setItem(storageKey, JSON.stringify(formData));
    }, [formData, storageKey, isSuccess]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose, submitting]);

    const handleChange = (event) => {
        const {name, value} = event.target;
        setFormData((current) => ({...current, [name]: value}));
        if (errors[name]) setErrors((current) => ({...current, [name]: null}));
        if (name === "mode" && errors.lieuOuLien) setErrors((current) => ({...current, lieuOuLien: null}));
        if (serverError) setServerError(null);
    };

    const validate = () => {
        const nextErrors = {};
        const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(formData.date);
        const timeIsValid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formData.heure);
        if (!formData.date) nextErrors.date = t("employerOffers.interviews.errors.dateRequired", "La date est requise.");
        else if (!dateIsValid) nextErrors.date = t("employerOffers.interviews.errors.invalidDate", "Entrez une date valide.");
        if (!formData.heure) nextErrors.heure = t("employerOffers.interviews.errors.timeRequired", "L'heure est requise.");
        else if (!timeIsValid) nextErrors.heure = t("employerOffers.interviews.errors.invalidTime", "Entrez une heure valide.");
        if (!formData.mode || !["VIDEO_CALL", "IN_PERSON"].includes(formData.mode)) nextErrors.mode = t("employerOffers.interviews.errors.modeRequired", "Le mode est requis.");

        const location = formData.lieuOuLien.trim();
        if (!location) {
            nextErrors.lieuOuLien = isVideoCall
                ? t("employerOffers.interviews.errors.videoLinkRequired", "Le lien de visioconférence est requis.")
                : t("employerOffers.interviews.errors.inPersonLocationRequired", "Le lieu de la rencontre est requis.");
        } else if (location.length > MAX_LOCATION_LENGTH) {
            nextErrors.lieuOuLien = t("employerOffers.interviews.errors.locationOrLinkTooLong", "Le lieu ou le lien est trop long.");
        } else if (isVideoCall && !isValidMeetingLink(location)) {
            nextErrors.lieuOuLien = t("employerOffers.interviews.errors.invalidVideoLink", "Entrez un lien valide commençant par http:// ou https://, par exemple https://teams.microsoft.com/… .");
        } else if (!isVideoCall && (looksLikeLink(location) || !isValidCanadianAddress(location))) {
            nextErrors.lieuOuLien = t("employerOffers.interviews.errors.invalidInPersonLocation", "Pour une rencontre en personne, indiquez une adresse ou un local, par exemple 123 rue Saint-Catherine, local 204.");
        }
        if (formData.message.trim().length > MAX_MESSAGE_LENGTH) nextErrors.message = t("employerOffers.interviews.errors.messageTooLong", "Le message est trop long.");

        if (dateIsValid && timeIsValid) {
            const selectedDateTime = new Date(`${formData.date}T${formData.heure}:00`);
            if (Number.isNaN(selectedDateTime.getTime())) nextErrors.date = t("employerOffers.interviews.errors.invalidDate", "Entrez une date valide.");
            else if (selectedDateTime <= new Date()) nextErrors.date = t("employerOffers.interviews.errors.dateInPast", "La date et l'heure de l'entrevue doivent être situées dans le futur.");
        }

        setErrors(nextErrors);
        setHasSubmitted(true);
        if (Object.keys(nextErrors).length > 0) scrollToError();
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setServerError(null);
        if (!validate()) return;
        setSubmitting(true);
        try {
            const cleanData = {...formData, lieuOuLien: formData.lieuOuLien.trim(), message: formData.message.trim()};
            const payload = {
                dateHeure: `${cleanData.date}T${cleanData.heure}:00`,
                mode: cleanData.mode,
                lieuOuLien: cleanData.lieuOuLien,
                messageOptionnel: cleanData.message
            };
            const call = isEdit ? api.employer.offers.modifierEntrevue : api.employer.offers.planifierEntrevue;
            const response = await call(offerId, candidat.id, payload);
            if (!response.ok) {
                const fallback = isVideoCall
                    ? t("employerOffers.interviews.errors.submitFailedVideo", "La planification a échoué. Vérifiez le lien, par exemple https://teams.microsoft.com/… .")
                    : t("employerOffers.interviews.errors.submitFailedInPerson", "La planification a échoué. Indiquez une adresse ou un local, par exemple 123 rue Saint-Catherine, local 204.");
                throw new Error(await getResponseError(response, fallback));
            }
            sessionStorage.removeItem(storageKey);
            setSubmittedData(cleanData);
            setFormData(DEFAULT_FORM_STATE);
            setErrors({});
            setHasSubmitted(false);
            setIsSuccess(true);
            if (onSuccess) onSuccess(cleanData);
        } catch (error) {
            setServerError({key: error.message || "employerOffers.interviews.errors.submitFailed"});
            scrollToError();
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditAfterSuccess = () => {
        setFormData(submittedData ?? DEFAULT_FORM_STATE);
        setIsEdit(true);
        setIsSuccess(false);
    };
    const renderError = (name) => errors[name] && <FieldError id={`${name}-error`}>{errors[name]}</FieldError>;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) onClose();
        }}>
            <div
                className="my-0 flex max-h-[calc(100vh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:my-6 sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                role="dialog" aria-modal="true" aria-labelledby="schedule-interview-title"
                aria-describedby="schedule-interview-description">
                <header className="shrink-0 border-b border-line bg-surface px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender/55 text-ink"><InterviewIcon
                                name="calendar" className="h-5 w-5"/></span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{isEdit ? t("employerOffers.interviews.editLabel", "Gestion de l'entrevue") : t("employerOffers.interviews.createLabel", "Nouvelle invitation")}</p>
                                <h2 id="schedule-interview-title"
                                    className="mt-0.5 text-xl font-black tracking-tight text-ink">{isEdit ? t("employerOffers.interviews.editTitle", "Modifier l'entrevue") : t("employerOffers.interviews.title", "Planifier une entrevue")}</h2>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} disabled={submitting}
                                aria-label={t("common.close", "Fermer")}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40 disabled:cursor-not-allowed disabled:opacity-50">
                            <InterviewIcon name="close" className="h-4 w-4"/></button>
                    </div>
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-canvas p-2.5">
                        <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/50 text-ink"><span
                            className="text-xs font-black">{candidateName.charAt(0).toUpperCase()}</span></span>
                        <div className="min-w-0"><p
                            className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("employerOffers.interviews.subtitle", "Candidat :")}</p>
                            <p className="truncate text-sm font-black text-ink">{candidateName}</p></div>
                    </div>
                </header>

                <div ref={contentRef} className="overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
                    {isSuccess ? (
                        <div className="py-4" role="status" aria-live="polite">
                            <div
                                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dff6e8] text-[#245e3b]">
                                <InterviewIcon name="check" className="h-9 w-9"/></div>
                            <div className="mt-5 text-center"><h3
                                className="text-xl font-black text-ink">{isEdit ? t("employerOffers.interviews.success.updatedTitle", "Entrevue modifiée avec succès !") : t("employerOffers.interviews.success.title", "Entrevue planifiée avec succès !")}</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t("employerOffers.interviews.success.description", "L'invitation a été envoyée au candidat.")}</p>
                            </div>
                            {submittedData &&
                                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-canvas p-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-start gap-3"><InterviewIcon name="calendar"
                                                                                               className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft"/>
                                            <div><p
                                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("employerOffers.interviews.date", "Date")}</p>
                                                <p className="mt-1 text-sm font-bold text-ink">{submittedData.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3"><InterviewIcon name="clock"
                                                                                               className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft"/>
                                            <div><p
                                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("employerOffers.interviews.time", "Heure")}</p>
                                                <p className="mt-1 text-sm font-bold text-ink">{submittedData.heure}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 sm:col-span-2"><InterviewIcon
                                            name={submittedData.mode === "VIDEO_CALL" ? "video" : "location"}
                                            className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft"/>
                                            <div className="min-w-0"><p
                                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("employerOffers.interviews.locationOrLink", "Lieu ou lien de la rencontre")}</p>
                                                <p className="mt-1 break-words text-sm font-bold text-ink">{submittedData.lieuOuLien}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>}
                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                                <button type="button" onClick={handleEditAfterSuccess}
                                        className="inline-flex items-center justify-center rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-canvas focus:outline-none focus:ring-4 focus:ring-lavender/60">{t("employerOffers.interviews.edit", "Modifier l'entrevue")}</button>
                                <button type="button" onClick={onClose}
                                        className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50">{t("common.close", "Fermer")}</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p id="schedule-interview-description"
                               className="mb-6 text-sm leading-6 text-ink-soft">{t("employerOffers.interviews.description", "Choisissez un moment et indiquez au candidat comment rejoindre la rencontre. Les champs marqués d’un astérisque sont obligatoires.")}</p>
                            {serverError && <div
                                className="mb-6 flex items-start gap-3 rounded-2xl border border-error bg-blush/25 p-4 text-sm font-semibold text-error"
                                role="alert"><InterviewIcon name="alert"
                                                            className="mt-0.5 h-5 w-5 shrink-0"/><span>{translateMessage(t, serverError)}</span>
                            </div>}
                            {hasSubmitted && Object.keys(errors).length > 0 &&
                                <div className="mb-6 rounded-2xl border border-error bg-blush/25 p-4" role="alert"><p
                                    className="text-sm font-black text-error">{t("employerOffers.interviews.errors.summary", "Vérifiez les champs indiqués avant de continuer.")}</p>
                                </div>}
                            <form onSubmit={handleSubmit} noValidate className="space-y-7">
                                <section>
                                    <div className="flex items-start gap-3"><span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender/45 text-ink"><InterviewIcon
                                        name="calendar" className="h-[18px] w-[18px]"/></span>
                                        <div><h3
                                            className="text-base font-black text-ink">{t("employerOffers.interviews.detailsTitle", "Date et heure")}</h3>
                                            <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.interviews.detailsDescription", "Planifiez une rencontre à venir avec le candidat.")}</p>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                        <div><FieldLabel htmlFor="interview-date"
                                                         required>{t("employerOffers.interviews.date", "Date")}</FieldLabel><input
                                            id="interview-date" type="date" name="date" min={today}
                                            value={formData.date} onChange={handleChange}
                                            aria-invalid={Boolean(errors.date)}
                                            aria-describedby={errors.date ? "date-error" : undefined}
                                            className={fieldClass(errors.date)}/>{renderError("date")}</div>
                                        <div><FieldLabel htmlFor="interview-time"
                                                         required>{t("employerOffers.interviews.time", "Heure")}</FieldLabel><input
                                            id="interview-time" type="time" name="heure" min={timeMin}
                                            value={formData.heure} onChange={handleChange}
                                            aria-invalid={Boolean(errors.heure)}
                                            aria-describedby={errors.heure ? "heure-error" : undefined}
                                            className={fieldClass(errors.heure)}/>{renderError("heure")}</div>
                                    </div>
                                </section>
                                <section className="border-t border-line pt-7">
                                    <div className="flex items-start gap-3"><span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/45 text-ink"><InterviewIcon
                                        name="video" className="h-[18px] w-[18px]"/></span>
                                        <div><h3
                                            className="text-base font-black text-ink">{t("employerOffers.interviews.logisticsTitle", "Informations pratiques")}</h3>
                                            <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.interviews.logisticsDescription", "Indiquez le mode et les informations nécessaires pour rejoindre la rencontre.")}</p>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-5">
                                        <div><FieldLabel htmlFor="interview-mode"
                                                         required>{t("employerOffers.interviews.mode", "Mode d'entrevue")}</FieldLabel><select
                                            id="interview-mode" name="mode" value={formData.mode}
                                            onChange={handleChange} aria-invalid={Boolean(errors.mode)}
                                            aria-describedby={errors.mode ? "mode-error" : undefined}
                                            className={fieldClass(errors.mode)}>
                                            <option
                                                value="VIDEO_CALL">{t("employerOffers.interviews.modes.video", "Visioconférence")}</option>
                                            <option
                                                value="IN_PERSON">{t("employerOffers.interviews.modes.inPerson", "En personne")}</option>
                                        </select>{renderError("mode")}</div>
                                        <div>
                                            <div className="flex items-center justify-between gap-3"><FieldLabel
                                                htmlFor="interview-location"
                                                required>{isVideoCall ? t("employerOffers.interviews.locationLabels.video", "Lien de la visioconférence") : t("employerOffers.interviews.locationLabels.inPerson", "Lieu de la rencontre")}</FieldLabel><span
                                                className="text-xs text-ink-soft">{formData.lieuOuLien.length}/{MAX_LOCATION_LENGTH}</span>
                                            </div>
                                            <input id="interview-location" type={isVideoCall ? "url" : "text"}
                                                   name="lieuOuLien" maxLength={MAX_LOCATION_LENGTH}
                                                   value={formData.lieuOuLien} onChange={handleChange}
                                                   placeholder={isVideoCall ? t("employerOffers.interviews.placeholders.videoLink", "Ex. : https://teams.microsoft.com/…") : t("employerOffers.interviews.placeholders.inPersonLocation", "Ex. : 123 rue Saint-Catherine, local 204")}
                                                   aria-invalid={Boolean(errors.lieuOuLien)}
                                                   aria-describedby={errors.lieuOuLien ? "lieuOuLien-error" : "location-help"}
                                                   className={fieldClass(errors.lieuOuLien)}/><p id="location-help"
                                                                                                 className="mt-1.5 text-xs text-ink-soft">{isVideoCall ? t("employerOffers.interviews.locationHint.video", "Ajoutez le lien de visioconférence à utiliser.") : t("employerOffers.interviews.locationHint.inPerson", "Ajoutez l’adresse ou le local de la rencontre.")}</p>{renderError("lieuOuLien")}
                                        </div>
                                    </div>
                                </section>
                                <section className="border-t border-line pt-7">
                                    <div className="flex items-start gap-3"><span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink/45 text-ink"><InterviewIcon
                                        name="message" className="h-[18px] w-[18px]"/></span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3"><h3
                                                className="text-base font-black text-ink">{t("employerOffers.interviews.messageTitle", "Message au candidat")}</h3>
                                                <span
                                                    className="text-xs text-ink-soft">{formData.message.length}/{MAX_MESSAGE_LENGTH}</span>
                                            </div>
                                            <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.interviews.messageDescription", "Ajoutez des précisions utiles au besoin. Ce champ est facultatif.")}</p>
                                        </div>
                                    </div>
                                    <textarea id="interview-message" name="message" rows="4"
                                              maxLength={MAX_MESSAGE_LENGTH} value={formData.message}
                                              onChange={handleChange}
                                              placeholder={t("employerOffers.interviews.placeholders.message", "Instructions particulières…")}
                                              aria-invalid={Boolean(errors.message)}
                                              aria-describedby={errors.message ? "message-error" : undefined}
                                              className={`${fieldClass(errors.message)} resize-y`}/>{renderError("message")}
                                </section>
                                <div
                                    className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
                                    <button type="button" onClick={onClose} disabled={submitting}
                                            className="inline-flex items-center justify-center rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-canvas focus:outline-none focus:ring-4 focus:ring-lavender/60 disabled:cursor-not-allowed disabled:opacity-50">{t("employerOffers.interviews.cancel", "Annuler")}</button>
                                    <button type="submit" disabled={submitting}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50">
                                        <InterviewIcon name="calendar"
                                                       className="h-4 w-4"/>{submitting ? t("employerOffers.interviews.submitting", "Planification en cours...") : isEdit ? t("employerOffers.interviews.saveChanges", "Enregistrer les modifications") : t("employerOffers.interviews.submit", "Confirmer l'entrevue")}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
