// Server-safe on purpose: the layout inlines this string, which it could not do if it were exported from a "use client" file.

export const BRAND_STORAGE_KEY = "brand";
export const THEME_STORAGE_KEY = "theme";

/** Runs before hydration so the saved brand color and light/dark theme are applied without a flash. Light is the default. */
export const INIT_SCRIPT = `try{var d=document.documentElement,b=localStorage.getItem("${BRAND_STORAGE_KEY}");if(b)d.dataset.brand=b;if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")d.classList.add("dark")}catch(e){}`;
