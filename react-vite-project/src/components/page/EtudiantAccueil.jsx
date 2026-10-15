import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../utils/api.js";
import Loading from "../Loading.jsx";
import PdfPreview from "../PdfPreview.jsx";

function normalizeStatus(value) {
    const status = String(value ?? "").trim().toUpperCase();

    if (["VALIDE", "VALIDATED", "APPROVED"].includes(status)) return "VALIDE";
    if (["REJETE", "REJECTED", "REJECT"].includes(status)) return "REJETE";
    return "EN_ATTENTE";
}

function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeOffer(offer) {
    return {
        ...offer,
        id: offer.id ?? offer.documentId,
        fileName: offer.fileName ?? offer.filename ?? "",
        statut: normalizeStatus(offer.statut ?? offer.status),
        title: offer.position ?? offer.jobTitle ?? offer.title ?? "",
        company: offer.nomEntreprise ?? offer.companyName ?? offer.company ?? "",
        description: offer.descriptionPosition ?? offer.description ?? "",
        publicationDate: offer.publishedAt ?? offer.datePublication ?? offer.createdAt ?? offer.updatedAt,
        startDate: offer.dateDebutStage ?? offer.startDate,
        endDate: offer.dateFinStage ?? offer.endDate,
        address: offer.adresseEntreprise ?? offer.companyAddress ?? offer.location ?? "",
        salary: offer.salaire ?? offer.salary ?? offer.hourlyPay,
        contactName: offer.contactName ?? offer.contactPerson ?? "",
        contactPhone: offer.contactPhone ?? offer.phone ?? "",
        discipline: offer.targetDiscipline ?? offer.discipline ?? "",
    };
}

function normalizeStudentValue(value) {
    if (value && typeof value === "object") {
        return [value.id, value.studentId, value.etudiantId, value.email, value.studentEmail, value.etudiantEmail]
            .filter(hasValue)
            .map((candidate) => String(candidate).trim().toLowerCase());
    }

    return hasValue(value) ? [String(value).trim().toLowerCase()] : [];
}

function getStudentIdentifiers(user) {
    return [user?.id, user?.email, user?.studentId, user?.etudiantId]
        .filter(hasValue)
        .map((value) => String(value).trim().toLowerCase());
}

function getOfferRestrictionIdentifiers(offer) {
    const restrictionFields = [
        offer.studentId,
        offer.etudiantId,
        offer.targetStudentId,
        offer.restrictedToStudentId,
        offer.studentEmail,
        offer.etudiantEmail,
        offer.targetStudentEmail,
        offer.restrictedToStudentEmail,
        offer.restrictedToStudent,
        offer.targetStudent,
        ...(Array.isArray(offer.studentIds) ? offer.studentIds : []),
        ...(Array.isArray(offer.etudiantIds) ? offer.etudiantIds : []),
        ...(Array.isArray(offer.targetStudentIds) ? offer.targetStudentIds : []),
        ...(Array.isArray(offer.restrictedStudentIds) ? offer.restrictedStudentIds : []),
        ...(Array.isArray(offer.students) ? offer.students : []),
        ...(Array.isArray(offer.etudiants) ? offer.etudiants : []),
        ...(Array.isArray(offer.targetStudents) ? offer.targetStudents : []),
    ];

    return restrictionFields.flatMap(normalizeStudentValue);
}

function isVisibleToStudent(offer, user) {
    const restrictionIdentifiers = getOfferRestrictionIdentifiers(offer);
    const studentIdentifiers = getStudentIdentifiers(user);
    const visibility = String(offer.visibility ?? offer.visibilite ?? "").trim().toUpperCase();
    const isPrivate = ["PRIVATE", "PRIVE", "PRIVEE", "TARGETED", "CIBLEE", "RESTRICTED", "RESTREINTE"].includes(visibility);
    const hasExplicitRestriction = restrictionIdentifiers.length > 0 || offer.public === false || offer.isPublic === false || isPrivate;

    if (!hasExplicitRestriction) return true;

    return restrictionIdentifiers.some((identifier) => studentIdentifiers.includes(identifier));
}

function formatDate(value, language) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatDateRange(startDate, endDate, language, t) {
    const start = formatDate(startDate, language);
    const end = formatDate(endDate, language);

    if (!start && !end) return "";
    if (!start) return end;
    if (!end) return start;

    return t("studentOffers.details.dateRange", {start, end});
}

function formatSalary(value, language, t) {
    if (!hasValue(value)) return t("studentOffers.details.unpaid");

    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);

    return `${new Intl.NumberFormat(language === "en" ? "en-CA" : "fr-CA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)} $/h`;
}

function truncateDescription(value, length = 155) {
    const description = String(value ?? "").trim();
    if (description.length <= length) return description;
    return `${description.slice(0, length).trimEnd()}…`;
}

function ArrowIcon({className = "h-5 w-5"}) {
    return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
    );
}

function OfferDetails({offer, language, t, onClose}) {
    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <article
                aria-labelledby="student-offer-details-title"
                aria-modal="true"
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_70px_rgba(48,35,55,0.25)] sm:rounded-[2rem]"
                role="dialog"
            >
                <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-9">
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <span
                            className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                            {t("studentOffers.details.label")}
                        </span>
                        <h2 id="student-offer-details-title"
                            className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                            {offer.title || t("studentOffers.untitled")}
                        </h2>
                        {offer.company && <p className="mt-2 text-base font-bold text-ink-soft">{offer.company}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("studentOffers.details.close")}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6 6 18"/>
                        </svg>
                    </button>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-line bg-canvas p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.publishedOn")}</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{formatDate(offer.publicationDate, language) || t("studentOffers.details.notSpecified")}</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-canvas p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.internshipPeriod")}</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{formatDateRange(offer.startDate, offer.endDate, language, t) || t("studentOffers.details.notSpecified")}</p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-line bg-canvas p-5 sm:p-6">
                    <h3 className="text-base font-black text-ink">{t("studentOffers.details.description")}</h3>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-soft">
                        {offer.description || t("studentOffers.details.notSpecified")}
                    </p>
                </div>

                <PdfPreview
                    documentId={offer.id}
                    fileName={offer.fileName}
                    className="mt-6"
                />

                <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {offer.address && <div><p
                        className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.location")}</p>
                        <p className="mt-1 text-sm text-ink">{offer.address}</p></div>}
                    <div><p
                        className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.salary")}</p>
                        <p className="mt-1 text-sm text-ink">{formatSalary(offer.salary, language, t)}</p></div>
                    {offer.contactName && <div><p
                        className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.contact")}</p>
                        <p className="mt-1 text-sm text-ink">{offer.contactName}</p></div>}
                    {offer.contactPhone && <div><p
                        className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.phone")}</p>
                        <p className="mt-1 text-sm text-ink">{offer.contactPhone}</p></div>}
                </div>
                </div>
            </article>
        </div>
    );
}

export default function EtudiantAccueil({user}) {
    const {t, i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const [cvState, setCvState] = useState("loading");
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setCvState("loading");
        setOffers([]);
        setError(false);

        const loadOffers = async () => {
            try {
                const cvResponse = await api.student.getCv();

                if (!isMounted) return;
                if (cvResponse.status === 204 || cvResponse.status === 404) {
                    setCvState("no-cv");
                    return;
                }
                if (!cvResponse.ok) throw new Error("student_cv_request_failed");

                const cv = await cvResponse.json();
                const cvStatus = normalizeStatus(cv?.statut ?? cv?.status);
                if (cvStatus !== "VALIDE") {
                    setCvState("blocked");
                    return;
                }

                const offersResponse = await api.student.getOffers();
                if (!offersResponse.ok) throw new Error("student_offers_request_failed");

                const offersData = await offersResponse.json();
                const visibleOffers = (Array.isArray(offersData) ? offersData : [])
                    .map(normalizeOffer)
                    .filter((offer) => offer.statut === "VALIDE" && isVisibleToStudent(offer, user))
                    .sort((first, second) => {
                        const firstDate = new Date(first.publicationDate ?? 0).getTime();
                        const secondDate = new Date(second.publicationDate ?? 0).getTime();
                        return secondDate - firstDate;
                    });

                if (isMounted) {
                    setOffers(visibleOffers);
                    setCvState("ready");
                }
            } catch {
                if (isMounted) {
                    setCvState("error");
                    setError(true);
                }
            }
        };

        loadOffers();
        return () => {
            isMounted = false;
        };
    }, [user]);

    if (cvState === "loading") return <Loading/>;

    return (
        <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span
                            className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("studentOffers.studentArea")}</span>
                        <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t("studentOffers.title")}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{t("studentOffers.description")}</p>
                    </div>
                </div>

                {(cvState === "blocked" || cvState === "no-cv") && (
                    <div className="mt-8 rounded-2xl border border-lavender bg-lavender/35 p-6" role="alert">
                        <h2 className="text-lg font-black text-ink">{t("studentOffers.cvRequiredTitle")}</h2>
                        <p className="mt-2 text-sm leading-6 text-ink-soft">
                            {t(cvState === "no-cv" ? "studentOffers.cvUploadRequired" : "studentOffers.cvRequired")}
                        </p>
                        {cvState === "no-cv" && (
                            <Link to="/etudiant"
                                  className="mt-5 inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50">
                                {t("studentOffers.uploadCv")}
                            </Link>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-8 rounded-2xl border border-error bg-blush/30 p-6" role="alert">
                        <p className="text-sm font-semibold text-error">{t("studentOffers.loadError")}</p>
                    </div>
                )}

                {cvState === "ready" && !error && offers.length === 0 && (
                    <div
                        className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_18px_50px_rgba(48,35,55,0.06)]">
                        <h2 className="text-xl font-black text-ink">{t("studentOffers.emptyTitle")}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t("studentOffers.emptyDescription")}</p>
                    </div>
                )}

                {cvState === "ready" && !error && offers.length > 0 && (
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {offers.map((offer) => (
                            <button
                                type="button"
                                key={offer.id ?? `${offer.title}-${offer.company}`}
                                onClick={() => setSelectedOffer(offer)}
                                className="group flex h-full flex-col rounded-[1.5rem] border border-line bg-surface p-6 text-left shadow-[0_12px_35px_rgba(48,35,55,0.05)] transition-all hover:-translate-y-0.5 hover:border-lavender hover:shadow-[0_18px_45px_rgba(48,35,55,0.1)] focus:outline-none focus:ring-4 focus:ring-pink/50"
                            >
                                <h2 className="text-xl font-black tracking-tight text-ink">{offer.title || t("studentOffers.untitled")}</h2>
                                {offer.company &&
                                    <p className="mt-1 text-sm font-bold text-ink-soft">{offer.company}</p>}
                                <p className="mt-4 flex-1 text-sm leading-6 text-ink-soft">{truncateDescription(offer.description) || t("studentOffers.noDescription")}</p>
                                <div
                                    className="mt-6 flex flex-nowrap items-center justify-between gap-3 border-t border-line pt-4">
                                    <div
                                        className="min-w-0 flex flex-1 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] font-semibold text-ink-soft sm:text-xs">
                                        <span
                                            className="block min-w-0 truncate">{formatDate(offer.publicationDate, language) || t("studentOffers.details.notSpecified")}</span>
                                        {offer.discipline && <>
                                            <span className="h-1 w-1 shrink-0 self-center rounded-full bg-line"
                                                  aria-hidden="true"/>
                                            <span className="shrink-0">{offer.discipline}</span>
                                            <span className="h-1 w-1 shrink-0 self-center rounded-full bg-line"
                                                  aria-hidden="true"/>
                                        </>}
                                        <span className="shrink-0">{formatSalary(offer.salary, language, t)}</span>
                                    </div>
                                    <span
                                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-ink-soft transition-colors group-hover:text-ink sm:text-sm"><span
                                        className="inline md:hidden lg:inline">{t("studentOffers.viewDetails")}</span><ArrowIcon/></span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedOffer && (
                <OfferDetails offer={selectedOffer} language={language} t={t} onClose={() => setSelectedOffer(null)}/>
            )}
        </section>
    );
}
