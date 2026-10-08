import api from "./api.js";

export async function getRedirectPathByRole(role) {
    const normalizedRole = String(role ?? "").replace(/^ROLE_/, "").toUpperCase();

    switch (normalizedRole) {
        case "GESTIONNAIRE":
            return "/gestionnaire";
        case "ETUDIANT":
            try {
                const cvResponse = await api.student.getCv();
                return cvResponse.ok && cvResponse.status !== 204 ? "/" : "/etudiant";
            } catch {
                return "/etudiant";
            }
        case "EMPLOYEUR":
            return "/employeur";
        case "PROFESSEUR":
        default:
            return "/";
    }
}
