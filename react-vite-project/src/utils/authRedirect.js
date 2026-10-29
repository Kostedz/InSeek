import api from "./api.js";

export async function getRedirectPathByRole(role) {
    const normalizedRole = String(role ?? "").replace(/^ROLE_/, "").toUpperCase();

    switch (normalizedRole) {
        case "GESTIONNAIRE":
            return "/";
        case "ETUDIANT":
            try {
                const cvResponse = await api.student.getCv();
                if (!cvResponse.ok || cvResponse.status === 204) return "/etudiant";

                const cv = await cvResponse.json();
                const status = String(cv?.statut ?? cv?.status ?? "").trim().toUpperCase();
                return ["VALIDE", "VALIDATED", "APPROVED"].includes(status) ? "/" : "/etudiant";
            } catch {
                return "/etudiant";
            }
        case "EMPLOYEUR":
            return "/";
        case "PROFESSEUR":
        default:
            return "/";
    }
}
