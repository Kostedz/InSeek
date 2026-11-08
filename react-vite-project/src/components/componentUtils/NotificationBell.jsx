import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import BASE_URL from "../config/Config.jsx";

const notificationTypes = {
    "CV en attente de validation.": "cvToApprove",
};

function NotificationBell({isLoggedIn}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isLoggedIn) {
            setNotifications([]);
            setUnreadCount(0);
            return undefined;
        }

        const eventSource = new EventSource(`${BASE_URL}notifications`);
        const handleNotification = (event) => {
            const message = event.data;
            const messageKey = notificationTypes[message];
            setNotifications((current) => {
                const existingNotification = current.find(
                    (notification) => notification.messageKey === messageKey && notification.message === message
                );

                if (existingNotification) {
                    return current.map((notification) =>
                        notification.id === existingNotification.id
                            ? {...notification, count: notification.count + 1}
                            : notification
                    );
                }

                return [
                    {id: `${Date.now()}-${Math.random()}`, message, messageKey, count: 1, actionPath: "/gestionnaire/cv"},
                    ...current,
                ].slice(0, 20);
            });
            setUnreadCount((count) => count + 1);
        };

        eventSource.addEventListener("notification", handleNotification);
        return () => {
            eventSource.removeEventListener("notification", handleNotification);
            eventSource.close();
        };
    }, [isLoggedIn]);

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
        setUnreadCount(0);
    };

    const clearNotification = (notificationId, event) => {
        event.stopPropagation();
        setNotifications((current) => current.filter(({id}) => id !== notificationId));
    };

    const openNotification = (notification) => {
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
                                            onClick={(event) => clearNotification(notification.id, event)}
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
