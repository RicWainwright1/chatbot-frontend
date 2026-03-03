"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

export default function Page() {
  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <Image
            alt="The Insights Family"
            className="mb-2"
            height={55}
            src="/images/tif-LOGO.png"
            width={180}
          />
          <h1 className="font-bold text-3xl text-primary">TIF Agent</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Access and query the TIF dataset to get realtime data on Kids,
            Parents and Families.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <button
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-2.5 font-medium text-sm text-foreground transition-colors hover:bg-secondary"
            onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/" })}
            type="button"
          >
            <svg
              height="20"
              viewBox="0 0 21 21"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect fill="#f25022" height="9" width="9" x="1" y="1" />
              <rect fill="#7fba00" height="9" width="9" x="11" y="1" />
              <rect fill="#00a4ef" height="9" width="9" x="1" y="11" />
              <rect fill="#ffb900" height="9" width="9" x="11" y="11" />
            </svg>
            Sign in with Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}
