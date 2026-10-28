import {useEffect, useState} from "react";
import api from "../../../utils/api.js";
import StudentConvocation from "../../componentUtils/etudiant/EtudiantConvocation.jsx";
import {normalizeOffer} from "../../componentUtils/offresUtils.js";

export default function EtudiantConvocations({user, onCountsChange}) {
    const [pendingCount, setPendingCount] = useState();
    const [offersCount, setOffersCount] = useState();
    const [applicationsCount, setApplicationsCount] = useState();

    useEffect(() => {
        let active = true;

        Promise.all([api.student.getOffers(), api.student.getAppliedOfferIds()])
            .then(async ([offersResponse, applicationsResponse]) => {
                if (!offersResponse.ok || !applicationsResponse.ok) return;

                const [offersData, applicationsData] = await Promise.all([
                    offersResponse.json(),
                    applicationsResponse.json(),
                ]);
                const appliedIds = new Set(
                    (Array.isArray(applicationsData) ? applicationsData : [])
                        .map((offerId) => String(offerId))
                );
                const availableOffers = (Array.isArray(offersData) ? offersData : [])
                    .map(normalizeOffer)
                    .filter((offer) => offer.statut === "VALIDE" && !appliedIds.has(String(offer.id)));

                if (active) {
                    setOffersCount(availableOffers.length);
                    setApplicationsCount(appliedIds.size);
                }
            })
            .catch((countError) => {
                setOffersCount(null);
                setApplicationsCount(null);
            });

        return () => {
            active = false;
        };
    }, [user]);

    useEffect(() => {
        onCountsChange?.({
            offersCount,
            applicationsCount,
            interviewsCount: pendingCount,
        });
    }, [onCountsChange, offersCount, applicationsCount, pendingCount]);

    return (
        <StudentConvocation user={user} page onPendingCountChange={setPendingCount}/>
    );
}
