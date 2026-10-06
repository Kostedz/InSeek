export function createTranslationMessage(key, options) {
    return {key, options};
}

export function translateMessage(t, message) {
    if (!message) return "";
    if (typeof message === "string") return t(message);

    return t(message.key, message.options);
}
