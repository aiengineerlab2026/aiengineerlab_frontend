// Tab icon in the selected brand color. A static icon file cannot follow a CSS variable, so the switcher rewrites
// the <link rel="icon"> tags with an SVG data URL. Same artwork as src/app/icon.svg (the green default); the
// gradient stops are the header's (see globals.css).

const GRADIENTS = {
  green: ["#059669", "#22c55e"],
  blue: ["#2563eb", "#0ea5e9"],
  red: ["#dc2626", "#f43f5e"],
} as const;

export type BrandId = keyof typeof GRADIENTS;

function iconSvg([from, to]: readonly [string, string]) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="64" height="64" rx="14" fill="url(#g)"/>` +
    `<rect x="4.5" y="4.5" width="55" height="55" rx="11.5" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"/>` +
    `<g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/>` +
    `<path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></g></svg>`
  );
}

/** Points every icon link of the page at the brand-colored SVG (the .ico stays as the fallback for old browsers). */
export function setFavicon(brand: BrandId) {
  const href = `data:image/svg+xml,${encodeURIComponent(iconSvg(GRADIENTS[brand] ?? GRADIENTS.green))}`;
  document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((link) => {
    link.href = href;
    link.type = "image/svg+xml";
    link.setAttribute("sizes", "any");
  });
}
