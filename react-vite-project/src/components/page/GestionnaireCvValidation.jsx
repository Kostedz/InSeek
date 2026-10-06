import { useEffect, useState } from "react";
import { api } from "../../utils/api.js";

const EXAMPLE_CVS = [
    {
        id: "example-cv-1",
        statut: "EN_ATTENTE",
        fileName: "camille-martin-cv.pdf",
        studentName: "Camille Martin",
        email: "camille.martin@example.com",
        discipline: "Informatique",
        submittedAt: "2026-09-28T10:30:00",
        size: "1.2 Mo",
    },
    {
        id: "example-cv-2",
        statut: "EN_ATTENTE",
        fileName: "olivier-gagnon-cv.pdf",
        studentName: "Olivier Gagnon",
        email: "olivier.gagnon@example.com",
        discipline: "Design graphique",
        submittedAt: "2026-09-27T15:45:00",
        size: "980 Ko",
    },
];

function normalizeCv(cv) {
    return {
        ...cv,
        id: cv.id ?? cv.documentId,
        statut: String(cv.statut ?? cv.status ?? "EN_ATTENTE").toUpperCase(),
        fileName: cv.fileName ?? cv.filename ?? "cv.pdf",
        studentName: cv.studentName ?? cv.nom ?? cv.name ?? cv.etudiant ?? "Étudiant non renseigné",
        email: cv.email ?? cv.studentEmail ?? "",
        discipline: cv.discipline ?? cv.targetDiscipline ?? cv.programme ?? "",
        submittedAt: cv.submittedAt ?? cv.createdAt ?? cv.dateSoumission ?? "",
        fileUrl: cv.fileUrl ?? cv.documentUrl ?? cv.downloadUrl ?? "",
    };
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function isPending(cv) {
    return cv.statut === "EN_ATTENTE";
}

function formatStatus(status) {
    const labels = {
        EN_ATTENTE: "En attente",
        VALIDE: "Validé",
        REJETE: "Rejeté",
    };

    return labels[status] ?? status;
}

function StatusBadge({ status }) {
    const colors = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
    };

    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${colors[status] ?? colors.EN_ATTENTE}`}>
            {formatStatus(status)}
        </span>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-1 text-sm text-ink">{value || "—"}</p>
        </div>
    );
}

function GestionnaireCvValidation() {
    const [cvs, setCvs] = useState(EXAMPLE_CVS.map(normalizeCv));
    const [selectedId, setSelectedId] = useState(EXAMPLE_CVS[0].id);
    const [comment, setComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [forbidden, setForbidden] = useState(false);

    const loadCvs = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.gestionnaire.getPendingCvs();

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if (!response.ok) throw new Error("load_failed");

            const payload = await response.json();
            const documents = Array.isArray(payload) ? payload : payload.items ?? payload.content ?? [];
            const normalized = documents.map(normalizeCv);

            setCvs(normalized);
            setSelectedId(normalized[0]?.id);
        } catch {
            setError("Le serveur est indisponible. Les données d’exemple sont affichées.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCvs();
    }, []);

    const pendingCvs = cvs.filter(isPending);
    const selectedCv = cvs.find((cv) => cv.id === selectedId) ?? pendingCvs[0];

    const saveDecision = (id, result, status) => {
        const currentCv = cvs.find((cv) => cv.id === id);
        const updatedCv = normalizeCv(result ?? { ...currentCv, statut: status, commentaireRejet: comment });

        setCvs((current) => current.map((cv) => (
            cv.id === id ? { ...cv, ...updatedCv } : cv
        )));
    };

    const handleApprove = async () => {
        if (!selectedCv || !isPending(selectedCv) || saving) return;

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await api.gestionnaire.approveCv(selectedCv.id);

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError("Ce CV n’est plus disponible pour validation. La liste a été actualisée.");
                await loadCvs();
                return;
            }

            if (!response.ok) throw new Error("approve_failed");

            saveDecision(selectedCv.id, await response.json().catch(() => null), "VALIDE");
            setMessage("CV validé. L’étudiant est maintenant autorisé à consulter les offres de stage.");
        } catch {
            setError("Une erreur est survenue pendant la validation du CV.");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!selectedCv || !isPending(selectedCv) || saving) return;

        if (!comment.trim()) {
            setError("Le commentaire est obligatoire pour rejeter un CV.");
            return;
        }

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await api.gestionnaire.rejectCv(selectedCv.id, comment.trim());

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError("Ce CV n’est plus disponible pour validation. La liste a été actualisée.");
                await loadCvs();
                return;
            }

            if (!response.ok) throw new Error("reject_failed");

            saveDecision(selectedCv.id, await response.json().catch(() => null), "REJETE");
            setMessage("CV rejeté. Le commentaire sera transmis à l’étudiant par notification et par courriel.");
            setComment("");
            setShowRejectForm(false);
        } catch {
            setError("Une erreur est survenue pendant le rejet du CV.");
        } finally {
            setSaving(false);
        }
    };

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                    <p className="text-sm font-bold text-error">403</p>
                    <h1 className="mt-2 text-3xl font-black text-ink">Accès refusé</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">
                        Cette page est réservée aux gestionnaires de stages.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                            Validation des CV
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-ink-soft">
                            Consultez les CV en attente et prenez une décision.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadCvs}
                        className="w-full rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/40 sm:w-auto"
                    >
                        Actualiser
                    </button>
                </div>

                {error && (
                    <p className="mt-6 rounded-xl border border-[#eab0bf] bg-[#fff0f3] px-4 py-3 text-sm font-semibold text-error" role="alert">
                        {error}
                    </p>
                )}
                {message && (
                    <p className="mt-6 rounded-xl border border-[#9ed9bd] bg-[#dff6e8] px-4 py-3 text-sm font-semibold text-[#245e3b]" role="status">
                        {message}
                    </p>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_30px_rgba(48,35,55,0.06)] lg:sticky lg:top-24">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-ink">CV en attente</h2>
                            <span className="rounded-full bg-gold px-3 py-1 text-sm font-bold text-ink">
                                {pendingCvs.length}
                            </span>
                        </div>

                        <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1 overscroll-contain sm:max-h-[36rem]">
                            {loading ? (
                                <p className="rounded-xl bg-lavender/40 p-4 text-sm text-ink-soft">Chargement…</p>
                            ) : pendingCvs.length ? (
                                pendingCvs.map((cv) => (
                                    <button
                                        key={cv.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(cv.id);
                                            setMessage("");
                                            setError("");
                                        }}
                                        className={`w-full rounded-xl border p-3 text-left ${
                                            selectedCv?.id === cv.id
                                                ? "border-ink bg-ink text-white"
                                                : "border-line bg-canvas text-ink hover:bg-lavender/30"
                                        }`}
                                    >
                                        <p className="text-xs font-bold uppercase tracking-wide opacity-70">{cv.studentName}</p>
                                        <p className="mt-1 text-sm font-bold">{cv.fileName}</p>
                                    </button>
                                ))
                            ) : (
                                <p className="rounded-xl bg-lavender/30 p-4 text-sm text-ink-soft">
                                    Aucun CV en attente.
                                </p>
                            )}
                        </div>
                    </aside>

                    {selectedCv ? (
                        <article className="rounded-2xl border border-line bg-surface shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                            <div className="border-b border-line p-4 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <StatusBadge status={selectedCv.statut} />
                                    <span className="text-xs text-ink-soft">CV : {selectedCv.id}</span>
                                </div>
                                <h2 className="mt-4 break-words text-xl font-black text-ink sm:text-2xl">{selectedCv.studentName}</h2>
                                <p className="mt-1 text-sm text-ink-soft">{selectedCv.email}</p>
                            </div>

                            <div className="grid gap-5 p-4 sm:gap-6 sm:p-6 md:grid-cols-2">
                                <div>
                                    <h3 className="font-black text-ink">Fichier PDF</h3>
                                    <div className="mt-3 rounded-xl border border-line bg-canvas p-4">
                                        <p className="font-bold text-ink">{selectedCv.fileName}</p>
                                        <p className="mt-1 text-sm text-ink-soft">{selectedCv.size || "Document téléversé"}</p>
                                        {selectedCv.fileUrl ? (
                                            <a
                                                href={selectedCv.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-4 inline-flex w-full justify-center rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-ink-soft sm:w-auto"
                                            >
                                                Ouvrir le PDF
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setMessage("Le lien du PDF sera fourni par le serveur.")}
                                                className="mt-4 w-full rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-ink-soft sm:w-auto"
                                            >
                                                Voir le PDF
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-black text-ink">Informations de l’étudiant</h3>
                                    <div className="mt-3 grid gap-4 rounded-xl border border-line p-4">
                                        <InfoItem label="Nom" value={selectedCv.studentName} />
                                        <InfoItem label="Courriel" value={selectedCv.email} />
                                        <InfoItem label="Discipline" value={selectedCv.discipline} />
                                        <InfoItem label="Soumis le" value={formatDate(selectedCv.submittedAt)} />
                                    </div>
                                </div>
                            </div>

                            {selectedCv.commentaireRejet && (
                                <div className="mx-5 mb-5 rounded-xl border border-[#eab0bf] bg-[#fff0f3] p-4 text-sm text-error sm:mx-6">
                                    <p className="font-bold">Commentaire du rejet</p>
                                    <p className="mt-1">{selectedCv.commentaireRejet}</p>
                                </div>
                            )}

                            {isPending(selectedCv) ? (
                                <div className="border-t border-line bg-canvas/60 p-4 sm:p-6">
                                    {showRejectForm && (
                                        <div className="mb-4">
                                            <label htmlFor="cv-rejection-comment" className="text-sm font-bold text-ink">
                                                Commentaire obligatoire
                                            </label>
                                            <textarea
                                                id="cv-rejection-comment"
                                                value={comment}
                                                onChange={(event) => setComment(event.target.value)}
                                                rows="4"
                                                className="mt-2 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink-soft focus:ring-4 focus:ring-lavender/50"
                                                placeholder="Expliquez les raisons du rejet…"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                        {showRejectForm && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setComment("");
                                                }}
                                                className="w-full rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/30 sm:w-auto"
                                            >
                                                Annuler
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => (showRejectForm ? handleReject() : setShowRejectForm(true))}
                                            className="w-full rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3] sm:w-auto"
                                        >
                                            {showRejectForm ? "Confirmer le rejet" : "Rejeter"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={handleApprove}
                                            className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft sm:w-auto"
                                        >
                                            {saving ? "Traitement…" : "Valider"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-line bg-canvas/60 p-5 text-sm font-semibold text-ink-soft sm:p-6">
                                    Ce CV a déjà été traité.
                                </div>
                            )}
                        </article>
                    ) : (
                        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
                            Sélectionnez un CV pour voir ses détails.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default GestionnaireCvValidation;