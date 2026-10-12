import {useEffect, useRef, useState} from "react";
import {Document, Page, pdfjs} from "react-pdf";
import {useTranslation} from "react-i18next";
import api from "../utils/api.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

function isDocumentId(value) {
    return value !== null && value !== undefined && /^\d+$/.test(String(value)) && Number(value) > 0;
}

export default function PdfPreview({file = null, documentId = null, fileName = "", className = ""}) {
    const {t} = useTranslation();
    const previewContainerRef = useRef(null);
    const [localUrl, setLocalUrl] = useState("");
    const [localFile, setLocalFile] = useState(null);
    const [remoteUrl, setRemoteUrl] = useState("");
    const [remoteDocumentId, setRemoteDocumentId] = useState("");
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [documentError, setDocumentError] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageCount, setPageCount] = useState(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const canFetchDocument = isDocumentId(documentId);
    const source = file
        ? localFile === file ? localUrl : ""
        : remoteDocumentId === String(documentId) ? remoteUrl : "";
    const isPreparingLocalFile = Boolean(file && localFile !== file);

    useEffect(() => {
        const element = previewContainerRef.current;
        if (!element) return undefined;

        const updateWidth = () => setContainerWidth(element.clientWidth);
        updateWidth();

        if (typeof ResizeObserver === "undefined") return undefined;
        const observer = new ResizeObserver(updateWidth);
        observer.observe(element);
        return () => observer.disconnect();
    }, [file, remoteUrl]);

    useEffect(() => {
        if (!file) {
            setLocalFile(null);
            setLocalUrl("");
            return undefined;
        }

        const createdUrl = URL.createObjectURL(file);
        setLocalFile(file);
        setLocalUrl(createdUrl);

        return () => {
            URL.revokeObjectURL(createdUrl);
        };
    }, [file]);

    useEffect(() => {
        let isMounted = true;
        let createdUrl = "";

        setRemoteUrl("");
        setRemoteDocumentId("");
        setFetchError(false);
        setDocumentError(false);
        setPageNumber(1);
        setPageCount(null);

        if (file || !canFetchDocument) {
            setIsFetching(false);
            return () => {
                isMounted = false;
            };
        }

        setIsFetching(true);
        api.documents.getFile(documentId)
            .then(async (response) => {
                if (!response.ok) throw new Error("pdf_fetch_failed");
                const blob = await response.blob();
                createdUrl = URL.createObjectURL(blob);
                if (isMounted) {
                    setRemoteUrl(createdUrl);
                    setRemoteDocumentId(String(documentId));
                }
            })
            .catch(() => {
                if (isMounted) setFetchError(true);
            })
            .finally(() => {
                if (isMounted) setIsFetching(false);
            });

        return () => {
            isMounted = false;
            if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
    }, [file, documentId, canFetchDocument]);

    const isLoading = isFetching || isPreparingLocalFile;
    if (!source && !isLoading && !fetchError) return null;

    const pageWidth = containerWidth > 32 ? Math.min(containerWidth - 32, 760) : undefined;

    return (
        <section className={`rounded-2xl border border-line bg-canvas p-4 ${className}`}
                 aria-label={t("pdfPreview.title")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t("pdfPreview.title")}</p>
                    {fileName && <p className="mt-1 break-all text-sm font-semibold text-ink">{fileName}</p>}
                </div>
                {pageCount > 1 && (
                    <p className="text-xs font-semibold text-ink-soft">
                        {t("pdfPreview.pageOf", {page: pageNumber, total: pageCount})}
                    </p>
                )}
            </div>

            {isLoading &&
                <p className="mt-4 rounded-xl bg-lavender/30 px-4 py-6 text-center text-sm text-ink-soft">{t("pdfPreview.loading")}</p>}
            {fetchError &&
                <p className="mt-4 rounded-xl border border-error bg-blush/30 px-4 py-3 text-sm font-semibold text-error">{t("pdfPreview.loadError")}</p>}

            {source && !fetchError && (
                <div ref={previewContainerRef}
                     className="mt-4 flex justify-center overflow-hidden rounded-xl bg-ink/10 p-2">
                    <Document
                        key={source}
                        file={source}
                        onLoadSuccess={({numPages}) => {
                            setPageCount(numPages);
                            setPageNumber((current) => Math.min(current, numPages));
                        }}
                        onLoadError={() => setDocumentError(true)}
                        loading={<p className="px-4 py-6 text-sm text-ink-soft">{t("pdfPreview.loading")}</p>}
                        error={<p
                            className="px-4 py-6 text-sm font-semibold text-error">{t("pdfPreview.loadError")}</p>}
                        noData={<p className="px-4 py-6 text-sm text-ink-soft">{t("pdfPreview.noDocument")}</p>}
                    >
                        {!documentError &&
                            <Page pageNumber={pageNumber} width={pageWidth} renderTextLayer renderAnnotationLayer/>}
                    </Document>
                </div>
            )}

            {pageCount > 1 && !documentError && (
                <div className="mt-3 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                        disabled={pageNumber <= 1}
                        className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-lavender/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t("pdfPreview.previous")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
                        disabled={pageNumber >= pageCount}
                        className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-lavender/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t("pdfPreview.next")}
                    </button>
                </div>
            )}
        </section>
    );
}
