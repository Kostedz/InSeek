import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import Loading from "../../Loading.jsx";
import {
    formatDate,
    formatDiscipline,
    formatOfferTitle,
    formatSalary,
    normalizeOffer,
    normalizeOfferStatus,
    truncateDescription,
} from "../../componentUtils/offresUtils.js";

import OfferDetails from "../../componentUtils/etudiant/acceuilUtils/OffresDetails.jsx";
import isVisibleToStudent from "../../componentUtils/etudiant/acceuilUtils/acceuilUtils.js";

export default function EtudiantAccueil({user, onCountsChange}) {
    const {t, i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const [cvState, setCvState] = useState("loading");
    const [studentCv, setStudentCv] = useState(null);
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [appliedOfferIds, setAppliedOfferIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [minimumSalary, setMinimumSalary] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setCvState("loading");
        setStudentCv(null);
        setOffers([]);
        setAppliedOfferIds([]);
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
                setStudentCv(cv);
                const cvStatus = normalizeOfferStatus(cv?.statut ?? cv?.status);
                if (cvStatus !== "VALIDE") {
                    setCvState("blocked");
                    return;
                }

                const [offersResponse, appliedOffersResponse] = await Promise.all([
                    api.student.getOffers(),
                    api.student.getAppliedOfferIds(),
                ]);
                if (!offersResponse.ok || !appliedOffersResponse.ok) {
                    throw new Error("student_offers_request_failed");
                }

                const [offersData, appliedOffersData] = await Promise.all([
                    offersResponse.json(),
                    appliedOffersResponse.json(),
                ]);
                const appliedIds = (Array.isArray(appliedOffersData) ? appliedOffersData : [])
                    .filter((offerId) => offerId !== null && offerId !== undefined)
                    .map((offerId) => String(offerId));
                const visibleOffers = (Array.isArray(offersData) ? offersData : [])
                    .map(normalizeOffer)
                    .filter((offer) => offer.statut === "VALIDE"
                        && isVisibleToStudent(offer, user)
                        && !appliedIds.includes(String(offer.id)))
                    .sort((first, second) => {
                        const firstDate = new Date(first.publicationDate ?? 0).getTime();
                        const secondDate = new Date(second.publicationDate ?? 0).getTime();
                        return secondDate - firstDate;
                    });

                if (isMounted) {
                    setAppliedOfferIds(appliedIds);
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

    useEffect(() => {
        onCountsChange?.({
            offersCount: cvState === "loading" ? undefined : offers.length,
            applicationsCount: cvState === "loading" ? undefined : appliedOfferIds.length,
        });
    }, [onCountsChange, cvState, offers.length, appliedOfferIds.length]);

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    const filteredOffers = offers.filter((offer) => {
        const searchableText = [offer.title, offer.company, offer.description, offer.address]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase();
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesSalary = !minimumSalary || (Number(offer.salary) || 0) >= Number(minimumSalary);
        return matchesSearch && matchesSalary;
    });

    return (
        <>
            {cvState === "loading" && <Loading/>}

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

                {cvState === "ready" && !error && (
                    <div
                        className="mt-8 grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:grid-cols-[minmax(0,1fr)_auto]">
                        <label className="sr-only"
                               htmlFor="student-offer-search">{t("studentOffers.filters.searchLabel")}</label>
                        <input
                            id="student-offer-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder={t("studentOffers.filters.searchPlaceholder")}
                            className="rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-4 focus:ring-pink/40"
                        />
                        <label className="sr-only"
                               htmlFor="student-offer-salary">{t("studentOffers.filters.salaryLabel")}</label>
                        <select
                            id="student-offer-salary"
                            value={minimumSalary}
                            onChange={(event) => setMinimumSalary(event.target.value)}
                            className="rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-4 focus:ring-pink/40"
                        >
                            <option value="">{t("studentOffers.filters.allSalaries")}</option>
                            <option value="15">{t("studentOffers.filters.salary15")}</option>
                            <option value="20">{t("studentOffers.filters.salary20")}</option>
                            <option value="25">{t("studentOffers.filters.salary25")}</option>
                        </select>
                    </div>
                )}

                {cvState === "ready" && !error && filteredOffers.length === 0 && (
                    <div
                        className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_18px_50px_rgba(48,35,55,0.06)]">
                        <h2 className="text-xl font-black text-ink">
                            {offers.length === 0 ? t("studentOffers.emptyTitle") : t("studentOffers.filters.noResults")}
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
                            {offers.length === 0 ? t("studentOffers.emptyDescription") : t("studentOffers.filters.noResultsDescription")}
                        </p>
                    </div>
                )}

                {cvState === "ready" && !error && filteredOffers.length > 0 && (
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {filteredOffers.map((offer) => (
                            <button
                                type="button"
                                key={offer.id ?? `${offer.title}-${offer.company}`}
                                onClick={() => setSelectedOffer(offer)}
                                className="group flex h-full flex-col rounded-[1.5rem] border border-line bg-surface p-6 text-left shadow-[0_12px_35px_rgba(48,35,55,0.05)] transition-all hover:-translate-y-0.5 hover:border-lavender hover:shadow-[0_18px_45px_rgba(48,35,55,0.1)] focus:outline-none focus:ring-4 focus:ring-pink/50"
                            >
                                <h2 className="text-xl font-black tracking-tight text-ink">{formatOfferTitle(offer.title) || t("studentOffers.untitled")}</h2>
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
                                            <span className="shrink-0">{formatDiscipline(offer.discipline, t)}</span>
                                            <span className="h-1 w-1 shrink-0 self-center rounded-full bg-line"
                                                  aria-hidden="true"/>
                                        </>}
                                        <span
                                            className="shrink-0">{formatSalary(offer.salary, language, t, "studentOffers.details.unpaid")}</span>
                                    </div>
                                    <span
                                        className="inline-flex shrink-0 items-center whitespace-nowrap text-xs font-bold text-ink-soft transition-colors group-hover:text-ink sm:text-sm">
                                        <span
                                            className="inline md:hidden lg:inline">{t("studentOffers.viewDetails")}</span>
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            {selectedOffer && (
                <OfferDetails
                    offer={selectedOffer}
                    language={language}
                    t={t}
                    studentCv={studentCv}
                    alreadyApplied={appliedOfferIds.some((appliedId) =>
                        String(appliedId) === String(selectedOffer.id))}
                    onApplicationSubmitted={(offerId) => {
                        setAppliedOfferIds((current) =>
                            current.some((appliedId) => String(appliedId) === String(offerId))
                                ? current
                                : [...current, offerId]);
                        setOffers((current) => current.filter((offer) => String(offer.id) !== String(offerId)));
                    }}
                    onClose={() => setSelectedOffer(null)}
                />
            )}
        </>
    );
}
