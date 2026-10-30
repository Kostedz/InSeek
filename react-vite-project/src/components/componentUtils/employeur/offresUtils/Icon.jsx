import React from "react";

export default function Icon({name, className = "h-5 w-5"}) {
    const paths = {
        check: <path d="m5 12 4 4L19 6"/>,
        file: <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M8 13h8M8 17h5"/>
        </>,
        plus: <>
            <path d="M12 5v14M5 12h14"/>
        </>,
        arrow: <>
            <path d="M5 12h14M13 6l6 6-6 6"/>
        </>,
        close: <path d="M6 6l12 12M18 6 6 18"/>,
        shield: <path d="M12 3 4.5 6v5.2c0 4.8 3.2 8.1 7.5 9.8 4.3-1.7 7.5-5 7.5-9.8V6z"/>,
        info: <>
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 11v5M12 8h.01"/>
        </>,
        users: <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </>,
        mail: <>
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="m3 7 9 6 9-6"/>
        </>,
        calendar: <>
            <rect x="3" y="4.5" width="18" height="17" rx="2"/>
            <path d="M16 2.5v4M8 2.5v4M3 9h18"/>
        </>,
        phone: <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 5.2 2 2 0 0 1 4.11 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 10.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/>,
        chevron: <path d="m9 18 6-6-6-6"/>,
        back: <path d="m15 18-6-6 6-6M9 12h10"/>,
    };

    return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {paths[name]}
        </svg>
    );
}