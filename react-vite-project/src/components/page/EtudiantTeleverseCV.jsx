import React, { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import fetcher from "../../utils/fetcher.js";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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


}