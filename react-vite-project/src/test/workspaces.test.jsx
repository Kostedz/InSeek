import React from "react";
import {describe, expect, it, vi} from "vitest";
import {api} from "../utils/api.js";
import EmployeurOffres from "../components/page/EmployeurOffres.jsx";
import GestionnaireValidation from "../components/page/GestionnaireValidation.jsx";
import {fireEvent, renderWithProviders, screen, userEvent, waitFor} from "./test-utils.jsx";

vi.mock("../components/PdfPreview.jsx", () => ({default: () => null}));
vi.mock("../components/page/ValidationTabs.jsx", () => ({default: () => null}));

describe("role workspaces", () => {
    it("creates an offer with its PDF and form fields", async () => {
        const submitOffer = vi.fn().mockResolvedValue({
            response: new Response(null, {status: 200}),
            offer: {
                id: 101,
                statut: "EN_ATTENTE",
                fileName: "offer.pdf",
                nomEntreprise: "NovaLab",
                position: "Stagiaire en développement web",
                targetDiscipline: "INFORMATIQUE",
                adresseEntreprise: "Montréal, Québec",
                dateDebutStage: "2099-05-04",
                dateFinStage: "2099-08-21",
                descriptionPosition: "Contribuer au développement et à l’amélioration de fonctionnalités web pour les projets de l’équipe.",
            },
        });
        const user = userEvent.setup();

        renderWithProviders(
            <EmployeurOffres
                offers={[]}
                canManageOffers
                companyName="NovaLab"
                onSubmit={submitOffer}
            />,
        );

        await user.click(screen.getByRole("button", {name: "Publier une nouvelle offre"}));
        const file = new File(["%PDF-1.7"], "offer.pdf", {type: "application/pdf"});

        await user.upload(screen.getByLabelText("Choisir un fichier PDF"), file);
        fireEvent.change(screen.getByRole("textbox", {name: "Titre du stage"}), {
            target: {value: "Stagiaire en développement web"},
        });
        fireEvent.change(screen.getByRole("combobox", {name: "Discipline"}), {target: {value: "INFORMATIQUE"}});
        fireEvent.change(screen.getByRole("textbox", {name: "Adresse de l’entreprise"}), {
            target: {value: "Montréal, Québec"},
        });
        fireEvent.change(document.getElementById("dateDebutStage"), {target: {value: "2099-05-04"}});
        fireEvent.change(document.getElementById("dateFinStage"), {target: {value: "2099-08-21"}});
        fireEvent.change(document.getElementById("descriptionPosition"), {
            target: {
                value: "Contribuer au développement et à l’amélioration de fonctionnalités web pour les projets de l’équipe.",
            },
        });

        await user.click(screen.getByRole("button", {name: "Soumettre l’offre"}));

        await waitFor(() => expect(submitOffer).toHaveBeenCalledTimes(1));
        const submission = submitOffer.mock.calls[0][0];
        const formContent = JSON.parse(submission.formData.get("formContent"));

        expect(submission.mode).toBe("create");
        expect(submission.formData.get("file")).toBe(file);
        expect(formContent).toMatchObject({
            type: "OffreDeStage",
            nomEntreprise: "NovaLab",
            position: "Stagiaire en développement web",
            targetDiscipline: "INFORMATIQUE",
            adresseEntreprise: "Montréal, Québec",
            dateDebutStage: "2099-05-04",
            dateFinStage: "2099-08-21",
        });
        await waitFor(() => expect(screen.getAllByRole("status").some((status) =>
            status.textContent.includes("Votre offre a été soumise avec succès"),
        )).toBe(true));
    });

    it("requires a PDF before an offer can be submitted", async () => {
        const submitOffer = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
            <EmployeurOffres offers={[]} canManageOffers companyName="NovaLab" onSubmit={submitOffer}/>,
        );

        await user.click(screen.getByRole("button", {name: "Publier une nouvelle offre"}));
        await user.click(screen.getByRole("button", {name: "Soumettre l’offre"}));

        expect(screen.getAllByRole("alert").some((alert) =>
            alert.textContent.includes("Ajoutez la version PDF de l’offre"),
        )).toBe(true);
        expect(submitOffer).not.toHaveBeenCalled();
    });

    it("loads an employer offer and displays its translated status", async () => {
        vi.spyOn(api.employer.offers, "list").mockResolvedValue(
            new Response(JSON.stringify([{
                id: 1,
                position: "Développeur web",
                statut: "EN_ATTENTE",
                targetDiscipline: "INFORMATIQUE",
                descriptionPosition: "Une description suffisamment longue pour être affichée dans la fiche.",
            }]), {status: 200}),
        );

        renderWithProviders(
            <EmployeurOffres
                canManageOffers
                companyName="NovaLab"
                isAccountEmailValidated
                drafts={{}}
                setDrafts={vi.fn()}
            />,
        );

        expect(await screen.findByRole("heading", {name: "Publiez vos offres de stage"})).toBeInTheDocument();
        expect(await screen.findByText("Développeur web")).toBeInTheDocument();
        expect(screen.getAllByText("En attente de validation").length).toBeGreaterThan(0);
    });

    it("loads an offer pending manager validation", async () => {
        vi.spyOn(api.gestionnaire, "getPendingDocuments").mockResolvedValue(
            new Response(JSON.stringify([{
                id: 12,
                statut: "EN_ATTENTE",
                position: "Stagiaire en développement web",
                targetDiscipline: "INFORMATIQUE",
                nomEntreprise: "NovaLab",
                email: "manager@example.com",
            }]), {status: 200}),
        );

        renderWithProviders(<GestionnaireValidation/>);

        expect(await screen.findByRole("heading", {name: "Validation des offres"})).toBeInTheDocument();
        expect((await screen.findAllByText("Stagiaire en développement web")).length).toBeGreaterThan(0);
        expect(screen.getAllByText("En attente de validation").length).toBeGreaterThan(0);
    });
});
