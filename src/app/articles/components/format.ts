const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** "Oct 14, 2026" from an ISO timestamp (only call it in the browser: the locale is the visitor's). */
export const formatDate = (iso: string) => date.format(new Date(iso));
