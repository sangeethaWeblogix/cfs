"use client";

import { useEffect, useState } from "react";

/**
 * Shows an email address as a mailto: link without ever putting the address
 * in the server-rendered HTML.
 *
 * Cloudflare's Email Address Obfuscation rewrites every address / mailto: link
 * it finds in the HTML into /cdn-cgi/l/email-protection, a URL that is 404 to
 * crawlers (Ahrefs reports it as a broken internal link on each page that has
 * an address). The server HTML splits the address around a <span> so there is
 * nothing for Cloudflare to match; once mounted, the real mailto: link is
 * rendered in its place.
 */
export default function ObfuscatedEmail({
  user,
  domain,
  newTab = false,
}: {
  user: string;
  domain: string;
  newTab?: boolean;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <span>
        {user}
        <span>@</span>
        {domain}
      </span>
    );
  }

  const address = `${user}@${domain}`;
  return (
    <a
      href={`mailto:${address}`}
      {...(newTab && { target: "_blank", rel: "noreferrer noopener" })}
    >
      {address}
    </a>
  );
}
