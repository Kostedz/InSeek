import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import Loading from "../../Loading.jsx";
import {normalizeOfferStatus} from "../studentOfferUtils.js";

export function StudentCvRequiredMessage({cvState, cv}) {
    const {t} = useTranslation();
    const hasNoCv = cvState === "no-cv";
    const isRejected = normalizeOfferStatus(cv?.statut ?? cv?.status) === "REJETE";
    const rejectionComment = cv?.commentaireRejet ?? cv?.rejectionComment ?? "";

    return (
        <div className="mt-8 rounded-2xl border border-lavender bg-lavender/35 p-6" role="alert">
            <h2 className="text-lg font-black text-ink">{t("studentOffers.cvRequiredTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
                {t(hasNoCv ? "studentOffers.cvUploadRequired" : isRejected ? "studentOffers.cvRejected" : "studentOffers.cvRequired")}
            </p>
            {isRejected && rejectionComment && (
                <div className="mt-4 rounded-xl border border-blush bg-blush/40 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                        {t("studentOffers.cvRejectionReason")}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink">{rejectionComment}</p>
                </div>
            )}
            {(hasNoCv || isRejected) && (
                <Link
                    to="/etudiant"
                    className="mt-5 inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50"
                >
                    {t(hasNoCv ? "studentOffers.uploadCv" : "studentOffers.updateCv")}
                </Link>
            )}
        </div>
    );
}

export default function StudentCvAccess({user, children}) {
    const {t} = useTranslation();
    const [state, setState] = useState({status: "loading", cv: null});

    useEffect(() => {
        let isMounted = true;

        setState({status: "loading", cv: null});
        api.student.getCv()
            .then(async (response) => {
                if (!isMounted) return;
                if (response.status === 204 || response.status === 404) {
                    setState({status: "no-cv", cv: null});
                    return;
                }
                if (!response.ok) throw new Error("student_cv_request_failed");

                const cv = await response.json();
                if (!isMounted) return;

                setState({
                    status: normalizeOfferStatus(cv?.statut ?? cv?.status) === "VALIDE" ? "ready" : "blocked",
                    cv,
                });
            })
            .catch(() => {
                if (isMounted) setState({status: "error", cv: null});
            });

        return () => {
            isMounted = false;
        };
    }, [user?.id, user?.email]);

    if (state.status === "loading") return <Loading/>;
    if (state.status === "no-cv" || state.status === "blocked") {
        return <StudentCvRequiredMessage cvState={state.status} cv={state.cv}/>;
    }
    if (state.status === "error") {
        return (
            <div className="mt-8 rounded-2xl border border-error bg-blush/30 p-6" role="alert">
                <p className="text-sm font-semibold text-error">{t("studentOffers.loadError")}</p>
            </div>
        );
    }

    return typeof children === "function" ? children({cv: state.cv}) : children;
}
