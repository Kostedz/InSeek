import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import BASE_URL from "../config/Config.jsx";
import fetcher from "../../utils/fetcher.js";

const notificationTypes = {
    "CV en attente de validation.": "cvToApprove",
};

function NotificationBell({user, isFloating = false}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);
    const recoveredForUserRef = useRef(null);
    const isLoggedIn = Boolean(user?.isLoggedIn);
    const userKey = user?.email ?? user?.courriel ?? user?.id;

    useEffect(() => {
        if (!isLoggedIn || !userKey) {
            recoveredForUserRef.current = null;
            setNotifications([]);
            setUnreadCount(0);
            return undefined;
        }

        let isActive = true;
        let eventSource;
        const notificationUrl = `${BASE_URL}notifications?recipient=${encodeURIComponent(userKey)}`;

        const mergeNotifications = (current, incomingNotifications) => {
            const merged = [...current];
            incomingNotifications.forEach((incoming) => {
                const message = incoming.message;
                const id = String(incoming.id ?? `${Date.now()}-${Math.random()}`);
                if (merged.some((notification) => notification.ids.includes(id))) {
                    return;
                }
                const messageKey = notificationTypes[message];
                const existingIndex = merged.findIndex(
                    (notification) => notification.messageKey === messageKey
                        && notification.message === message
                );

                if (existingIndex >= 0) {
                    const existing = merged[existingIndex];
                    merged[existingIndex] = {
                        ...existing,
                        ids: [...existing.ids, id],
                        count: existing.count + 1,
                    };
                } else {
                    merged.unshift({
                        id,
                        ids: [id],
                        message,
                        messageKey,
                        count: 1,
                        actionPath: "/gestionnaire/cv",
                    });
                }
            });
            return merged.slice(0, 20);
        };

        const addNotification = (notification) => {
            setNotifications((current) => {
                return mergeNotifications(current, [notification]);
            });
        };

        const connectToNotifications = () => {
            if (!isActive) return undefined;
            eventSource = new EventSource(notificationUrl);
            eventSource.addEventListener("notification", (event) => {
                try {
                    addNotification(JSON.parse(event.data));
                } catch {
                    addNotification({message: event.data});
                }
                setUnreadCount((count) => count + 1);
            });
            return eventSource;
        };

        const recoverAndConnect = async () => {
            if (recoveredForUserRef.current === userKey) {
                connectToNotifications();
                return;
            }
            recoveredForUserRef.current = userKey;
            try {
                const response = await fetcher("/notifications/recover", {
                    headers: {Accept: "application/json"},
                });
                if (response.ok) {
                    const recoveredNotifications = await response.json();
                    if (Array.isArray(recoveredNotifications)) {
                        setNotifications((current) => mergeNotifications(current, recoveredNotifications));
                        setUnreadCount((count) => count + recoveredNotifications.length);
                    }
                }
                if (!response.ok) {
                    recoveredForUserRef.current = null;
                }
            } catch (error) {
                recoveredForUserRef.current = null;
            } finally {
                connectToNotifications();
            }
        };

        recoverAndConnect();

        return () => {
            isActive = false;
            eventSource?.close();
        };
    }, [isLoggedIn, userKey]);

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    const toggleNotifications = () => {
        setIsOpen((open) => !open);
    };

    const clearNotification = async (notification, event) => {
        event.stopPropagation();
        const response = await fetcher("/notifications/clear", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(notification.ids),
        });
        if (!response.ok) return;
        setNotifications((current) => current.filter(({id}) => id !== notification.id));
        setUnreadCount((count) => Math.max(0, count - notification.count));
    };

    const openNotification = async (notification) => {
        await clearNotification(notification, {stopPropagation: () => {}});
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
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-2 focus:ring-pink"
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
                    className={`absolute right-0 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink-soft bg-surface text-ink shadow-[0_18px_50px_rgba(48,35,55,0.2)] ${
                        isFloating
                            ? "bottom-full mb-2"
                            : "top-full mt-2"
                    }`}
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
                                    <div className="flex items-stretch gap-2 px-3 py-2 text-sm">
                                        <button
                                            type="button"
                                            onClick={() => openNotification(notification)}
                                            className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-left font-semibold text-ink shadow-sm transition-colors hover:border-pink hover:bg-pink/20 focus:outline-none focus:ring-2 focus:ring-pink"
                                        >
                                            {getNotificationMessage(notification)}
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={t("notifications.clear")}
                                            onClick={(event) => clearNotification(notification, event)}
                                            className="shrink-0 self-center rounded-lg border border-line px-2 py-1 text-lg leading-4 text-ink/50 transition-colors hover:border-peach hover:bg-peach/30 hover:text-ink focus:outline-none focus:ring-2 focus:ring-pink"
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
