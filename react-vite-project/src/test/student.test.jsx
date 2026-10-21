import React from "react";
import {describe, expect, it, vi} from "vitest";
import {api} from "../utils/api.js";
import ApplyButton from "../components/etudiant/ApplyButton.jsx";
import EtudiantAccueil from "../components/page/EtudiantAccueil.jsx";
import EtudiantTeleverseCV from "../components/page/EtudiantTeleverseCV.jsx";
import {fireEvent, renderWithProviders, screen, userEvent, waitFor} from "./test-utils.jsx";

vi.mock("../components/PdfPreview.jsx", () => ({default: () => null}));

describe("student flows", () => {
    it("marks an offer as already applied after a successful application", async () => {
        vi.spyOn(api.student, "applyToOffer").mockResolvedValue(new Response(null, {status: 200}));
        const onAppliedSuccess = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(<ApplyButton offerId={42} onAppliedSuccess={onAppliedSuccess}/>);
        await user.click(screen.getByRole("button", {name: "Postuler"}));

        await waitFor(() => expect(screen.getByRole("button", {name: "Déjà postulé"})).toBeDisabled());
        expect(onAppliedSuccess).toHaveBeenCalledWith(42);
    });

    it("blocks the student offers page when there is no CV", async () => {
        vi.spyOn(api.student, "getCv").mockResolvedValue(new Response(null, {status: 204}));

        renderWithProviders(<EtudiantAccueil user={{id: 7, email: "student@example.com"}}/>);

        expect(await screen.findByRole("heading", {name: "Accès aux offres bloqué"})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Téléverser mon CV"})).toHaveAttribute("href", "/etudiant");
    });

    it("shows a validation error for a non-PDF CV", async () => {
        const user = userEvent.setup();
        renderWithProviders(<EtudiantTeleverseCV cvData={null}/>);

        const file = new File(["not a pdf"], "notes.txt", {type: "text/plain"});
        fireEvent.change(screen.getByLabelText("Choisir un fichier PDF"), {target: {files: [file]}});

        expect(screen.getByRole("alert")).toHaveTextContent("Format invalide");
        expect(screen.getByRole("button", {name: "Téléverser le CV"})).toBeDisabled();
    });

    it("uploads a valid PDF and displays the translated success message", async () => {
        vi.spyOn(api.student, "uploadCv").mockResolvedValue(
            new Response(JSON.stringify({
                id: 10,
                fileName: "resume.pdf",
                size: 1024,
                statut: "EN_ATTENTE"
            }), {status: 200}),
        );
        const user = userEvent.setup();
        renderWithProviders(<EtudiantTeleverseCV cvData={null}/>);

        const file = new File(["%PDF-1.7"], "resume.pdf", {type: "application/pdf"});
        await user.upload(screen.getByLabelText("Choisir un fichier PDF"), file);
        await user.click(screen.getByRole("button", {name: "Téléverser le CV"}));

        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Votre CV a été téléversé avec succès"));
        expect(api.student.uploadCv).toHaveBeenCalledWith(file);
    });
});
