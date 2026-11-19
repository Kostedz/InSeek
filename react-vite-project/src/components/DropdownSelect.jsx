export default function DropdownSelect({className = "", wrapperClassName = "", children, ...props}) {
    return <span className={`group relative block ${wrapperClassName}`}>
        <select {...props} className={`${className} appearance-none pe-11`}>
            {children}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round"
             className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink transition-transform duration-200 motion-reduce:transition-none group-has-[:open]:rotate-180">
            <path d="m6 9 6 6 6-6"/>
        </svg>
    </span>;
}
