"use client";

import type { ReactNode } from "react";

type OauthConnectLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
};

/**
 * Next.js client transitions can swallow some route-handler redirects. OAuth start
 * must perform a full navigation so the browser follows the 302 to Google (etc.).
 */
export function OauthConnectLink({ href, className, children }: OauthConnectLinkProps) {
  const forceFullLoad = href.startsWith("/oauth/");

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (forceFullLoad) {
          event.preventDefault();
          window.location.assign(href);
        }
      }}
    >
      {children}
    </a>
  );
}
