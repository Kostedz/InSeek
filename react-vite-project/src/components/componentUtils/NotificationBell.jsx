import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import BASE_URL from "../config/Config.jsx";
import api from "../../utils/api.js";

const notificationTypes = {
    "CV en attente de validation.": "cvToApprove",
};

const getAuthToken = () => localStorage.getItem("token") || sessionStorage.getItem("token") || "";

function toNotification(data) {
    const directLink = String(data.lienDirect ?? "");
    const legacyOfferPath = directLink.match(/^\/employeur\/offres\/(\d+)\/candidatures$/);
    const legacyOfferQuery = directLink.match(/^\/employeur\?offre=(\d+)$/);
    const offerId = legacyOfferPath?.[1] ?? legacyOfferQuery?.[1];
    return {
        id: data.id ?? `${Date.now()}-${Math.random()}`,
        message: data.message ?? data.me ?? data.titre ?? "",
        count: 1,
        actionPath: offerId ? `/employeur/offre/${offerId}` : data.lienDirect || "/employeur",
    };
}

function NotificationBell({isLoggedIn}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);
    const knownMessages = useRef(new Map());

    useEffect(() => {
        if (!isLoggedIn) {
            setNotifications([]);
            setUnreadCount(0);
            knownMessages.current = new Map();
            return undefined;
        }

        let isMounted = true;

        const addNotifications = (incoming) => {
            const fresh = [];
            const updated = new Map();

            incoming.forEach((n) => {
                if (!knownMessages.current.has(n.id)) {
                    fresh.push(n);
                } else if (knownMessages.current.get(n.id) !== n.message) {
                    updated.set(n.id, n);
                }
            });
            if (fresh.length === 0 && updated.size === 0) return;

            fresh.forEach((n) => knownMessages.current.set(n.id, n.message));
            updated.forEach((n, id) => knownMessages.current.set(id, n.message));

            setNotifications((current) => {
                const bumped = current.filter(({id}) => updated.has(id)).map(({id}) => updated.get(id));
                const rest = current.filter(({id}) => !updated.has(id));
                return [...fresh, ...bumped, ...rest].slice(0, 20);
            });
            setUnreadCount((count) => count + fresh.length + updated.size);
        };

        const loadStored = async () => {
            try {
                const response = await api.notifications.mine();
                if (!response.ok || !isMounted) return;
                const list = await response.json();
                if (isMounted && Array.isArray(list)) addNotifications(list.map(toNotification));
            } catch (err) {
                console.error("Erreur chargement notifications:", err);
            }
        };

        const handleNotification = (event) => {
            const raw = event.data;

            if (typeof raw === "string" && raw.startsWith("{")) {
                try {
                    addNotifications([toNotification(JSON.parse(raw))]);
                } catch (err) {
                    console.error("Erreur parsing notification SSE:", err);
                }
                return;
            }

            const messageKey = notificationTypes[raw];
            setNotifications((current) => {
                const existing = current.find(
                    (n) => n.messageKey === messageKey && n.message === raw
                );
                if (existing) {
                    return current.map((n) =>
                        n.id === existing.id ? {...n, count: n.count + 1} : n
                    );
                }
                return [
                    {id: `${Date.now()}-${Math.random()}`, message: raw, messageKey, count: 1, actionPath: "/gestionnaire/cv"},
                    ...current,
                ].slice(0, 20);
            });
            setUnreadCount((count) => count + 1);
        };

        const token = getAuthToken();
        const url = `${BASE_URL}notifications${token ? `?token=${encodeURIComponent(token)}` : ""}`;
        const eventSource = new EventSource(url);

        loadStored();
        eventSource.onopen = loadStored;
        eventSource.addEventListener("notification", handleNotification);

        return () => {
            isMounted = false;
            eventSource.removeEventListener("notification", handleNotification);
            eventSource.close();
        };
    }, [isLoggedIn]);

    const markAsRead = (notification) => {
        if (typeof notification.id === "number") {
            api.notifications.markRead(notification.id).catch(() => {});
        }
    };

    const toggleNotifications = () => {
        setIsOpen((open) => !open);
        setUnreadCount(0);
    };

    const clearNotification = (notification, event) => {
        event.stopPropagation();
        markAsRead(notification);
        setNotifications((current) => current.filter(({id}) => id !== notification.id));
    };

    const openNotification = (notification) => {
        markAsRead(notification);
        setIsOpen(false);
        navigate(notification.actionPath);
    };

    const getNotificationMessage = (notification) => {
        if (!notification.messageKey) return notification.message;
        return notification.count > 1
            ? t(`notifications.${notification.messageKey}Count`, {count: notification.count})
            : t(`notifications.${notification.messageKey}`);
    };

    if (!isLoggedIn) return null;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={toggleNotifications}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-2 focus:ring-pink md:bg-transparent md:hover:bg-white/10"
                aria-label={t("notifications.open")}
                aria-expanded={isOpen}
                aria-controls="notification-menu"
            >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-peach px-1 text-[10px] font-black text-ink">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    id="notification-menu"
                    role="region"
                    aria-label={t("notifications.title")}
                    className="absolute bottom-full right-0 z-50 mb-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink-soft bg-surface text-ink shadow-[0_18px_50px_rgba(48,35,55,0.2)] md:bottom-auto md:top-full md:mb-0 md:mt-2"
                >
                    <div className="border-b border-line px-4 py-3">
                        <h2 className="text-sm font-black">{t("notifications.title")}</h2>
                    </div>
                    {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-ink/60">
                            {t("notifications.empty")}
                        </p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto">
                            {notifications.map((notification) => (
                                <li key={notification.id} className="border-b border-line last:border-b-0">
                                    <div className="flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-ink/5">
                                        <button
                                            type="button"
                                            onClick={() => openNotification(notification)}
                                            className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-pink"
                                        >
                                            {getNotificationMessage(notification)}
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={t("notifications.clear")}
                                            onClick={(event) => clearNotification(notification, event)}
                                            className="shrink-0 rounded-md px-1 text-lg leading-4 text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink focus:outline-none focus:ring-2 focus:ring-pink"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
