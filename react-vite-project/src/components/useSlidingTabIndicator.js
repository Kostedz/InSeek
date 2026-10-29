import {useLayoutEffect, useRef, useState} from "react";

export default function useSlidingTabIndicator(activeTab, storageKey) {
    const navRef = useRef(null);
    const tabRefs = useRef({});
    const [indicator, setIndicator] = useState(null);
    const [animate, setAnimate] = useState(false);

    useLayoutEffect(() => {
        const nav = navRef.current;
        const activeNode = activeTab ? tabRefs.current[activeTab] : null;
        let animationFrame;

        const measure = (node) => {
            if (!nav || !node) return null;
            const navRect = nav.getBoundingClientRect();
            const tabRect = node.getBoundingClientRect();
            return {
                transform: `translate(${tabRect.left - navRect.left}px, ${tabRect.top - navRect.top}px)`,
                width: `${tabRect.width}px`,
                height: `${tabRect.height}px`,
            };
        };

        if (!activeNode) {
            setIndicator(null);
            setAnimate(false);
            if (storageKey) window.sessionStorage.removeItem(storageKey);
            return undefined;
        }

        const previousTab = storageKey ? window.sessionStorage.getItem(storageKey) : null;
        const previousNode = previousTab ? tabRefs.current[previousTab] : null;
        const previousPosition = previousTab !== activeTab ? measure(previousNode) : null;
        const activePosition = measure(activeNode);

        setAnimate(Boolean(previousPosition));
        setIndicator(previousPosition ?? activePosition);

        if (previousPosition) {
            animationFrame = window.requestAnimationFrame(() => setIndicator(measure(activeNode)));
        }

        if (storageKey) window.sessionStorage.setItem(storageKey, activeTab);

        const handleResize = () => setIndicator(measure(activeNode));
        window.addEventListener("resize", handleResize);
        const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(handleResize);
        if (resizeObserver && nav) resizeObserver.observe(nav);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", handleResize);
            resizeObserver?.disconnect();
        };
    }, [activeTab, storageKey]);

    return {
        navRef,
        tabRefs,
        indicator,
        indicatorClassName: `pointer-events-none absolute left-0 top-0 z-0 rounded-xl bg-ink shadow-sm ${animate ? "transition-[transform,width,height] duration-200 ease-out" : ""}`,
    };
}
