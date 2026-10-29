import {describe, expect, it, vi} from "vitest";
import {FormValidator} from "../utils/formValidator.js";
import mergeHeaders from "../utils/mergeheader.js";
import {getRedirectPathByRole} from "../utils/authRedirect.js";
import {api} from "../utils/api.js";

describe("shared utilities", () => {
    it("validates a complete registration form", () => {
        const formData = {
            prenom: "Zoé",
            nom: "Tremblay",
            email: "zoe@example.com",
            password: "Password1!",
            confirmPassword: "Password1!",
            entreprise: "",
        };

        expect(FormValidator.isRegisterFormValid(formData, false, {})).toBe(true);
        expect(FormValidator.isRegisterFormValid(formData, true, {})).toBe(false);
    });

    it("merges headers case-insensitively and removes null values", () => {
        expect(mergeHeaders({Authorization: "Bearer token"}, {"content-type": "application/json"})).toEqual({
            authorization: "Bearer token",
            "content-type": "application/json",
        });
        expect(mergeHeaders({Authorization: "Bearer token"}, {Authorization: null})).toEqual({});
    });

    it("redirects validated students to offers and others to their workspace", async () => {
        vi.spyOn(api.student, "getCv").mockResolvedValue(
            new Response(JSON.stringify({statut: "VALIDE"}), {status: 200}),
        );

        await expect(getRedirectPathByRole("ROLE_ETUDIANT")).resolves.toBe("/");
        await expect(getRedirectPathByRole("ROLE_GESTIONNAIRE")).resolves.toBe("/gestionnaire");
        await expect(getRedirectPathByRole("EMPLOYEUR")).resolves.toBe("/");
    });
});
