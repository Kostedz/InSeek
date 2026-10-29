import React from "react";
import {describe, expect, it, vi} from "vitest";
import {api} from "../utils/api.js";
import GestionnaireValidation from "../components/page/gestionnaire/GestionnaireValidation.jsx";
import GestionnaireCvValidation from "../components/page/gestionnaire/GestionnaireCvValidation.jsx";
import {renderWithProviders, screen, userEvent, waitFor} from "./test-utils.jsx";

vi.mock("../components/PdfPreview.jsx", () => ({default: () => null}));
vi.mock("../components/page/gestionnaire/GestionnaireTabs.jsx", () => ({default: () => null}));

const pendingOffer = {
    id: 12,
    statut: "EN_ATTENTE",
    position: "Stagiaire en développement web",
    targetDiscipline: "INFORMATIQUE",
    nomEntreprise: "NovaLab",
    email: "manager@example.com",
    descriptionPosition: "Contribuer au développement et à l’amélioration de fonctionnalités web pour l’équipe.",
};

describe("manager validation workflows", () => {
    it("approves a pending internship offer", async () => {
        vi.spyOn(api.gestionnaire, "getPendingDocuments").mockResolvedValue(
            new Response(JSON.stringify([pendingOffer]), {status: 200}),
        );
        const approveDocument = vi.spyOn(api.gestionnaire, "approveDocument").mockResolvedValue(
            new Response(JSON.stringify({...pendingOffer, statut: "VALIDE"}), {status: 200}),
        );

        renderWithProviders(<GestionnaireValidation/>);

        expect((await screen.findAllByText("Stagiaire en développement web")).length).toBeGreaterThan(0);
        await userEvent.setup().click(screen.getByRole("button", {name: "Valider"}));

        await waitFor(() => expect(approveDocument).toHaveBeenCalledWith(12));
        expect(await screen.findByRole("status")).toHaveTextContent("Offre validée");
        expect(screen.getByText("Validé")).toBeInTheDocument();
    });

    it("requires a rejection comment and sends it when an offer is refused", async () => {
        vi.spyOn(api.gestionnaire, "getPendingDocuments").mockResolvedValue(
            new Response(JSON.stringify([pendingOffer]), {status: 200}),
        );
        const rejectDocument = vi.spyOn(api.gestionnaire, "rejectDocument").mockResolvedValue(
            new Response(JSON.stringify({...pendingOffer, statut: "REJETE"}), {status: 200}),
        );
        const user = userEvent.setup();

        renderWithProviders(<GestionnaireValidation/>);

        await screen.findAllByText("Stagiaire en développement web");
        await user.click(screen.getByRole("button", {name: "Refuser"}));
        expect(screen.getByRole("button", {name: "Confirmer le refus"})).toBeDisabled();

        await user.type(screen.getByLabelText("Motif du refus obligatoire"), "La description doit préciser les livrables.");
        await user.click(screen.getByRole("button", {name: "Confirmer le refus"}));

        await waitFor(() => expect(rejectDocument).toHaveBeenCalledWith(
            12,
            "La description doit préciser les livrables.",
        ));
        expect(await screen.findByRole("status")).toHaveTextContent("Offre refusée");
    });

    it("approves a pending student CV", async () => {
        vi.spyOn(api.gestionnaire, "getPendingDocuments").mockResolvedValue(
            new Response(JSON.stringify([{
                id: 24,
                statut: "EN_ATTENTE",
                fileName: "camille-martin-cv.pdf",
                prenom: "Camille",
                nom: "Martin",
                email: "camille@example.com",
                discipline: "INFORMATIQUE",
            }]), {status: 200}),
        );
        const approveDocument = vi.spyOn(api.gestionnaire, "approveDocument").mockResolvedValue(
            new Response(JSON.stringify({id: 24, statut: "VALIDE"}), {status: 200}),
        );

        renderWithProviders(<GestionnaireCvValidation/>);

        expect(await screen.findByText("camille-martin-cv.pdf")).toBeInTheDocument();
        await userEvent.setup().click(screen.getByRole("button", {name: "Valider"}));

        await waitFor(() => expect(approveDocument).toHaveBeenCalledWith(24));
        expect(await screen.findByRole("status")).toHaveTextContent("CV validé");
    });
});
