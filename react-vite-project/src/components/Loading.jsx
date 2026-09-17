import React from "react";

const Loading = () => {
    return (
        <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-canvas px-4" data-testid="loading-component">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-lavender border-t-ink" role="status" aria-label="Chargement" />
                <p className="text-sm font-semibold text-ink-soft">Chargement en cours…</p>
            </div>
        </div>
    )
}
export default Loading;
