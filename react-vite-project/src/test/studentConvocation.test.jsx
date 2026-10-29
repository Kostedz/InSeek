
import { describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, renderWithProviders, screen, waitFor, within } from "./test-utils.jsx";
import api from "../utils/api.js";
import StudentInterviews from "../components/page/etudiant/StudentConvocation.jsx";

describe("StudentInterviews", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const convocations = [
        {
            id: 1,
            position: "Stage en informatique",
            nomEntreprise: "NovaLab",
            DateAndTime: "2099-06-15T10:00:00",
            interviewInvitationStatus: "PENDING",
        },
        {
            id: 2,
            position: "Développeur Java",
            nomEntreprise: "TechCorp",
            DateAndTime: "2026-10-01T10:00:00",
            interviewInvitationStatus: "ACCEPTED",
        },
        {
            id: 3,
            position: "Développeur Web",
            nomEntreprise: "WebPlus",
            DateAndTime: "2026-10-05T10:00:00",
            interviewInvitationStatus: "REJECTED",
        },
        {
            id: 4,
            position: "Développeur logiciel",
            nomEntreprise: "CodeWorks",
            DateAndTime: "2026-10-10T10:00:00",
            interviewInvitationStatus: "EXPIRED",
        },
    ];

    it("displays expired convocations in history with an EXPIRED badge", async () => {
        vi.spyOn(api.student, "getConvocations").mockResolvedValue(
            new Response(JSON.stringify(convocations), { status: 200 }),
        );

        renderWithProviders(<StudentInterviews user={{ id: 1 }} />);

        // Open the full list.
        await screen.findByText("Stage en informatique");
        fireEvent.click(screen.getByRole("button", { name: /Voir toutes/i }));

        // Switch to history.
        fireEvent.click(
            screen.getByRole("button", { name: /Historique/i }),
        );

        // The expired convocation should appear in history.
        expect(
            await screen.findByText("Développeur logiciel"),
        ).not.toBeNull();

        const expiredItem = screen
            .getByText("Développeur logiciel")
            .closest("button");

        expect(expiredItem).not.toBeNull();

        expect(
            within(expiredItem).getByText("Expirée"),
        ).not.toBeNull();

        // The other historical convocations should still be present.
        expect(screen.getByText("Développeur Java")).not.toBeNull();
        expect(screen.getByText("Développeur Web")).not.toBeNull();
    });

    it("normalizes a past pending convocation to EXPIRED", async () => {
        vi.spyOn(api.student, "getConvocations").mockResolvedValue(
            new Response(
                JSON.stringify([
                    {
                        id: 5,
                        position: "Ancienne convocation",
                        nomEntreprise: "NovaLab",
                        DateAndTime: "2020-01-01T10:00:00",
                        interviewInvitationStatus: "PENDING",
                    },
                ]),
                { status: 200 },
            ),
        );

        renderWithProviders(<StudentInterviews user={{ id: 1 }} />);

        fireEvent.click(
            await screen.findByRole("button", { name: /Voir toutes/i }),
        );

        fireEvent.click(
            screen.getByRole("button", { name: /Historique/i }),
        );

        const expiredItem = await screen.findByText("Ancienne convocation");

        expect(expiredItem).not.toBeNull();

        const card = expiredItem.closest("button");

        expect(within(card).getByText("Expirée")).not.toBeNull();
    });
});
