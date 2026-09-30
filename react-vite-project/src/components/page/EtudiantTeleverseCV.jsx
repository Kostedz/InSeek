import React, { useState, useRef } from "react";
import fetcher from "../../utils/fetcher.js";

export default function EtudiantTeleverseCV({cvData, isAccountEmailValidated = true, onCvUpdated}) {
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const status = cvData?.status || "NOT_SUBMITTED";
    const rejectionComment = cvData?.rejectionComment || "";

    const validateFile = (file) => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!file) return false;

        if (file.type !== "application/pdf") {
            setErrorMessage("Format invalide. Seuls les fichiers au format PDF (.pdf) sont acceptés.");
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Le fichier dépasse la taille maximale autorisée de 5 Mo.");
            return false;
        }

        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault();
        if (isAccountEmailValidated) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isAccountEmailValidated) return;

        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || !isAccountEmailValidated) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        const formData = new FormData();
        formData.append("cv", selectedFile);

        try {
            const res = await fetcher("/student/cv/upload", {
                method: "POST",
                body: formData,
            });

            if (res.status === 403) {
                setErrorMessage("Accès refusé. Veuillez d'abord valider votre compte par courriel avant de téléverser un CV.");
                return;
            }

            if (!res.ok) {
                throw new Error("Une erreur est survenue lors de l'envoi du fichier.");
            }

            const responseData = await res.json();

            if (status === "VALIDATED") {
                setSuccessMessage("Votre CV mis à jour a été téléversé avec succès et remis en attente de validation.");
            } else if (status === "REJECTED") {
                setSuccessMessage("Votre version corrigée a été soumise avec succès au gestionnaire de stage.");
            } else {
                setSuccessMessage("Votre CV a été téléversé avec succès. Il est maintenant en cours d'analyse par le gestionnaire.");
            }

            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            if (onCvUpdated) {
                onCvUpdated(responseData);
            }
        } catch (err) {
            setErrorMessage(err.message || "Erreur de connexion au serveur. Réessayez plus tard.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="flex flex-1 items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div
                className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-9">
                <span
                    className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">Espace étudiant</span>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">Téléverser mon CV</h1>
                <p className="mt-3 text-sm leading-7 text-ink-soft">Déposez votre CV en format PDF pour le soumettre au
                    gestionnaire de stages.</p>

                {!isAccountEmailValidated && (
                    <p className="mt-6 rounded-xl border border-peach bg-peach/40 px-4 py-3 text-sm font-medium text-ink"
                       role="alert">
                        Veuillez d'abord valider votre compte par courriel avant de téléverser un CV.
                    </p>
                )}

                {status === "REJECTED" && rejectionComment && (
                    <p className="mt-6 rounded-xl border border-blush bg-blush/40 px-4 py-3 text-sm text-ink"
                       role="status">
                        <strong>Commentaire du gestionnaire :</strong> {rejectionComment}
                    </p>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div
                        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${isDragging ? "border-pink bg-pink/30" : "border-line bg-canvas"}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            id="cv-file"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleFileChange}
                            disabled={!isAccountEmailValidated}
                            className="sr-only"
                        />
                        <label htmlFor="cv-file"
                               className="cursor-pointer text-sm font-bold text-ink underline decoration-pink decoration-4 underline-offset-4">
                            Choisir un fichier PDF
                        </label>
                        <p className="mt-2 text-sm text-ink-soft">ou glissez-déposez votre fichier ici</p>
                        <p className="mt-1 text-xs text-ink-soft">Taille maximale : 5 Mo</p>
                        {selectedFile &&
                            <p className="mt-4 rounded-xl bg-lavender/45 px-3 py-2 text-sm font-semibold text-ink"
                               role="status">{selectedFile.name}</p>}
                    </div>

                    {errorMessage &&
                        <p className="rounded-xl border border-error bg-blush/30 px-4 py-3 text-sm font-medium text-error"
                           role="alert">{errorMessage}</p>}
                    {successMessage &&
                        <p className="rounded-xl border border-lemon bg-lemon/45 px-4 py-3 text-sm font-medium text-ink"
                           role="status">{successMessage}</p>}

                    <button
                        type="submit"
                        disabled={!selectedFile || !isAccountEmailValidated || isSubmitting}
                        className="w-full rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "Téléversement en cours…" : "Téléverser le CV"}
                    </button>
                </form>
            </div>
        </section>
    );
}
