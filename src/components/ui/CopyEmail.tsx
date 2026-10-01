"use client";

import { useState } from "react";

export default function CopyEmail({ email, label, done }: { email: string; label: string; done: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="cta ghost"
      data-magnet
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        } catch {
          /* no clipboard: the address is right there to select */
        }
      }}
    >
      {ok ? done : label}
    </button>
  );
}
