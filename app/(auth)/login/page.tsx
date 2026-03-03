"use client";

import { signIn } from "next-auth/react";

export default function Page() {
  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <img src="/images/tif-LOGO.png" alt="The Insights Family" width={180} height={55} className="mb-2" />
          <h1 className="font-bold text-3xl text-primary">TIF Agent</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Access and query the TIF dataset to get realtime data on Kids, Parents and Families.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <button
            onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/" })}
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-2.5 font-medium text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}
