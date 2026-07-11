import { useEffect } from "react";

export function MatomoTracker() {
  useEffect(() => {
    const matomoUrl = import.meta.env.VITE_MATOMO_URL;
    const siteId = import.meta.env.VITE_MATOMO_SITE_ID;

    if (!matomoUrl || !siteId) return;

    window._paq = window._paq || [];
    window._paq.push(["disableCookies"]);
    window._paq.push(["setTrackerUrl", `${matomoUrl}/matomo.php`]);
    window._paq.push(["setSiteId", siteId]);
    window._paq.push(["trackPageView"]);
    window._paq.push(["enableLinkTracking"]);

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://cdn.matomo.cloud/${new URL(matomoUrl).hostname}/matomo.js`;
    document.head.appendChild(script);
  }, []);

  return null;
}
