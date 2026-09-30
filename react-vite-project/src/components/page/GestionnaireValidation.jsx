import {useEffect, useMemo, useState} from "react";
import fetcher from "../../utils/fetcher.js";

const API = {
    pending: "/gestionnaire/documents/pending",
    approve: (id) => `/gestionnaire/documents/${id}/approve`,
    reject: (id) => `/gestionnaire/documents/${id}/reject`,
};

// Remove the sample when the backend is ready to provide real data. The sample offers are used for demonstration purposes only.
const SAMPLE_OFFERS = [
    {
        id: "sample-1",
        statut: "EN_ATTENTE",
        fileName: "offre-stage-developpement.pdf",
        nomEntreprise: "NovaLab Solutions",
        position: "Stagiaire en développement logiciel",
        email: "marie.gagnon@novalab.ca",
        contactName: "Marie Gagnon",
        contactPhone: "+1 514 555-0182",
        targetDiscipline: "Informatique",
        dateDebutStage: "2026-05-04",
        dateFinStage: "2026-08-21",
        adresseEntreprise: "1450, rue Saint-Urbain, Montréal, QC",
        descriptionPosition: "Contribuer au développement de fonctionnalités web et aux tests automatisés.",
        size: 2480000,
    },
    {
        id: "sample-2",
        statut: "EN_ATTENTE",
        fileName: "stage-design-ux.pdf",
        nomEntreprise: "Atelier Nord",
        position: "Stagiaire en design UX/UI",
        email: "alexandre.roy@ateliernord.com",
        contactName: "Alexandre Roy",
        contactPhone: "+1 418 555-0114",
        targetDiscipline: "Design graphique",
        dateDebutStage: "2026-01-12",
        dateFinStage: "2026-04-24",
        adresseEntreprise: "88, boulevard René-Lévesque O., Québec, QC",
        descriptionPosition: "Participer à la recherche utilisateur et à la création de prototypes.",
        size: 1840000,
    },
];


function normalizeOffer(offer) {
    return {
        ...offer,
        id: offer.id ?? offer.documentId,
        statut: String(offer.statut ?? offer.status ?? "EN_ATTENTE").toUpperCase(),
        fileName: offer.fileName ?? offer.filename ?? "offre-de-stage.pdf",
        nomEntreprise: offer.nomEntreprise ?? offer.companyName ?? offer.company ?? "Entreprise non renseignée",
        position: offer.position ?? offer.jobTitle ?? offer.title ?? "Titre du poste non renseigné",
        email: offer.email ?? offer.contactEmail ?? "",
        contactName: offer.contactName ?? offer.contactPerson ?? "",
        contactPhone: offer.contactPhone ?? offer.phone ?? "",
        targetDiscipline: offer.targetDiscipline ?? offer.discipline ?? "",
        dateDebutStage: offer.dateDebutStage ?? offer.startDate,
        dateFinStage: offer.dateFinStage ?? offer.endDate,
        adresseEntreprise: offer.adresseEntreprise ?? offer.companyAddress ?? offer.location ?? "",
        descriptionPosition: offer.descriptionPosition ?? offer.description ?? "",
        fileUrl: offer.fileUrl ?? offer.documentUrl ?? offer.downloadUrl ?? "",
    };
}

function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function isPending(offer) {
    return offer.statut === "EN_ATTENTE";
}

function StatusBadge({status}) {
    const styles = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
    };
    const labels = {
        EN_ATTENTE: "En attente",
        VALIDE: "Validée",
        REJETE: "Rejetée",
    };
    const statusKey = status === "VALIDÉ" ? "VALIDE" : status;

    return (
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${styles[statusKey] ?? styles.EN_ATTENTE}`}>
            {labels[statusKey] ?? status}
        </span>
    );
}

function InfoItem({label, value}) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-1 text-sm text-ink">{value || "—"}</p>
        </div>
    );
}

function GestionnaireValidation() {
    const [offers, setOffers] = useState(SAMPLE_OFFERS.map(normalizeOffer));
    const [selectedId, setSelectedId] = useState(SAMPLE_OFFERS[0].id);
    const [comment, setComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [forbidden, setForbidden] = useState(false);

    const loadOffers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetcher(API.pending, {method: "GET"});

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if (!response.ok) throw new Error("load_failed");

            const data = await response.json();
            const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            const normalized = list.map(normalizeOffer);

            setOffers(normalized);
            setSelectedId(normalized[0]?.id);
        } catch {
            setError("Le serveur est indisponible. Les données d’exemple sont affichées.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const pendingOffers = useMemo(() => offers.filter(isPending), [offers]);
    const selectedOffer = offers.find((offer) => offer.id === selectedId) ?? pendingOffers[0];

    const updateOffer = (id, result, fallbackStatus) => {
        const fallbackOffer = offers.find((offer) => offer.id === id);
        const updatedOffer = normalizeOffer(result ?? {
            ...fallbackOffer,
            statut: fallbackStatus,
            commentaireRejet: comment,
        });

        setOffers((currentOffers) => currentOffers.map((offer) => (
            offer.id === id ? {...offer, ...updatedOffer} : offer
        )));
    };

    const handleApprove = async () => {
        if (!selectedOffer || !isPending(selectedOffer) || saving) return;

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetcher(API.approve(selectedOffer.id), {method: "PUT"});

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError("Cette offre n’est plus disponible pour révision. La liste a été actualisée.");
                await loadOffers();
                return;
            }

            if (!response.ok) throw new Error("approve_failed");

            updateOffer(selectedOffer.id, await response.json().catch(() => null), "VALIDE");
            setMessage("Offre approuvée. Elle est maintenant visible aux étudiants.");
        } catch {
            setError("Une erreur est survenue pendant l’approbation.");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOffer || !isPending(selectedOffer) || saving) return;

        if (!comment.trim()) {
            setError("Le commentaire est obligatoire pour rejeter une offre.");
            return;
        }

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetcher(API.reject(selectedOffer.id), {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({commentaire: comment.trim()}),
            });

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError("Cette offre n’est plus disponible pour révision. La liste a été actualisée.");
                await loadOffers();
                return;
            }

            if (!response.ok) throw new Error("reject_failed");

            updateOffer(selectedOffer.id, await response.json().catch(() => null), "REJETE");
            setMessage("Offre rejetée. Le commentaire a été enregistré pour l’employeur.");
            setComment("");
            setShowRejectForm(false);
        } catch {
            setError("Une erreur est survenue pendant le rejet.");
        } finally {
            setSaving(false);
        }
    };

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div
                    className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                    <p className="text-sm font-bold text-error">403</p>
                    <h1 className="mt-2 text-3xl font-black text-ink">Accès refusé</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">Cette page est réservée aux gestionnaires de
                        stages.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-ink">Validation des offres</h1>
                        <p className="mt-2 text-sm leading-6 text-ink-soft">Consultez les offres en attente et prenez
                            une décision.</p>
                    </div>
                    <button type="button" onClick={loadOffers}
                            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/40">Actualiser
                    </button>
                </div>

                {error &&
                    <p className="mt-6 rounded-xl border border-[#eab0bf] bg-[#fff0f3] px-4 py-3 text-sm font-semibold text-error"
                       role="alert">{error}</p>}
                {message &&
                    <p className="mt-6 rounded-xl border border-[#9ed9bd] bg-[#dff6e8] px-4 py-3 text-sm font-semibold text-[#245e3b]"
                       role="status">{message}</p>}

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-ink">En attente</h2>
                            <span
                                className="rounded-full bg-gold px-3 py-1 text-sm font-bold text-ink">{pendingOffers.length}</span>
                        </div>

                        <div className="mt-4 space-y-2">
                            {loading ? (
                                <p className="rounded-xl bg-lavender/40 p-4 text-sm text-ink-soft">Chargement…</p>
                            ) : pendingOffers.length ? (
                                pendingOffers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(offer.id);
                                            setMessage("");
                                            setError("");
                                        }}
                                        className={`w-full rounded-xl border p-3 text-left ${selectedOffer?.id === offer.id ? "border-ink bg-ink text-white" : "border-line bg-canvas text-ink hover:bg-lavender/30"}`}
                                    >
                                        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{offer.nomEntreprise}</p>
                                        <p className="mt-1 text-sm font-bold">{offer.position}</p>
                                    </button>
                                ))
                            ) : (
                                <p className="rounded-xl bg-lavender/30 p-4 text-sm text-ink-soft">Aucune offre en
                                    attente.</p>
                            )}
                        </div>
                    </aside>

                    {selectedOffer ? (
                        <article
                            className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                            <div className="border-b border-line p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <StatusBadge status={selectedOffer.statut}/>
                                    <span className="text-xs text-ink-soft">ID : {selectedOffer.id}</span>
                                </div>
                                <h2 className="mt-4 text-2xl font-black text-ink">{selectedOffer.position}</h2>
                                <p className="mt-1 font-semibold text-ink-soft">{selectedOffer.nomEntreprise}</p>
                            </div>

                            <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
                                <div>
                                    <h3 className="font-black text-ink">Document PDF</h3>
                                    <div className="mt-3 rounded-xl border border-line bg-canvas p-4">
                                        <p className="font-bold text-ink">{selectedOffer.fileName}</p>
                                        <p className="mt-1 text-sm text-ink-soft">{selectedOffer.size ? `${(selectedOffer.size / 1000000).toFixed(1)} Mo` : "Document téléversé"}</p>
                                        {selectedOffer.fileUrl ? (
                                            <a href={selectedOffer.fileUrl} target="_blank" rel="noreferrer"
                                               className="mt-4 inline-block rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-ink-soft">Ouvrir
                                                le PDF</a>
                                        ) : (
                                            <button type="button"
                                                    onClick={() => setMessage("Le lien du PDF sera fourni par le serveur.")}
                                                    className="mt-4 rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-ink-soft">Voir
                                                le PDF</button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-black text-ink">Informations de l’employeur</h3>
                                    <div className="mt-3 grid gap-4 rounded-xl border border-line p-4">
                                        <InfoItem label="Nom de l’entreprise" value={selectedOffer.nomEntreprise}/>
                                        <InfoItem label="Personne-ressource" value={selectedOffer.contactName}/>
                                        <InfoItem label="Courriel" value={selectedOffer.email}/>
                                        <InfoItem label="Téléphone" value={selectedOffer.contactPhone}/>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <h3 className="font-black text-ink">Détails du stage</h3>
                                    <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                                        <InfoItem label="Titre du poste" value={selectedOffer.position}/>
                                        <InfoItem label="Discipline" value={selectedOffer.targetDiscipline}/>
                                        <InfoItem label="Dates"
                                                  value={`${formatDate(selectedOffer.dateDebutStage)} au ${formatDate(selectedOffer.dateFinStage)}`}/>
                                        <InfoItem label="Lieu" value={selectedOffer.adresseEntreprise}/>
                                        <div className="sm:col-span-2"><InfoItem label="Description"
                                                                                 value={selectedOffer.descriptionPosition}/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isPending(selectedOffer) ? (
                                <div className="rounded-b-2xl border-t border-line bg-canvas/60 p-5 sm:p-6">
                                    {showRejectForm && (
                                        <div className="mb-4">
                                            <label htmlFor="rejection-comment" className="text-sm font-bold text-ink">Commentaire
                                                de rejet obligatoire</label>
                                            <textarea id="rejection-comment" value={comment}
                                                      onChange={(event) => setComment(event.target.value)} rows="4"
                                                      className="mt-2 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink-soft focus:ring-4 focus:ring-lavender/50"
                                                      placeholder="Expliquez les corrections demandées…"/>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap justify-end gap-3">
                                        {showRejectForm && <button type="button" onClick={() => {
                                            setShowRejectForm(false);
                                            setComment("");
                                        }}
                                                                   className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/30">Annuler</button>}
                                        <button type="button" disabled={saving}
                                                onClick={() => showRejectForm ? handleReject() : setShowRejectForm(true)}
                                                className="rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3]">{showRejectForm ? "Confirmer le rejet" : "Rejeter"}</button>
                                        <button type="button" disabled={saving} onClick={handleApprove}
                                                className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft">{saving ? "Traitement…" : "Approuver"}</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="rounded-b-2xl border-t border-line bg-canvas/60 p-5 text-sm font-semibold text-ink-soft">Cette
                                    offre a déjà été traitée.</div>
                            )}
                        </article>
                    ) : (
                        <div
                            className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">Sélectionnez
                            une offre pour voir ses détails.</div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default GestionnaireValidation;
