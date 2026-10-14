const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** "Oct 14, 2026" from an ISO timestamp (only call it in the browser: the locale is the visitor's). */
export const formatDate = (iso: string) => date.format(new Date(iso));

/**
 * Browsers ignore a line break at the very end of a block, but the editor shows it as an empty line (it adds a
 * trailing break of its own). Doubling it makes the reader show the same empty line the author saw.
 */
export const withVisibleBreaks = (html: string) => html.replace(/<br\s*\/?>\s*<\/(p|li|h[1-4]|blockquote)>/g, "<br><br></$1>");
