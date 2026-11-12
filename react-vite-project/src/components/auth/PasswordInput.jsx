import {useState} from "react";
import {useTranslation} from "react-i18next";

export default function PasswordInput({className = "", ...inputProps}) {
    const {t} = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
        <span className="relative block">
            <input {...inputProps} type={visible ? "text" : "password"} className={`${className} pr-11`}/>
            <button type="button" onClick={() => setVisible((current) => !current)}
                    disabled={inputProps.disabled}
                    aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-ink-soft hover:text-ink disabled:opacity-60">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                     className="h-5 w-5">
                    {visible ? <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.7 4.2 9.5 6.1a2.2 2.2 0 010 1.8 11.8 11.8 0 01-3.1 4.1M6.2 6.2a12 12 0 00-3.7 4.9 2.2 2.2 0 000 1.8A10.8 10.8 0 0012 19a10.4 10.4 0 003-.4"/>
                    </> : <>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </>}
                </svg>
            </button>
        </span>
    );
}
