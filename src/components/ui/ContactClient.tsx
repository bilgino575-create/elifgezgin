"use client";

import { useState } from "react";

export function CopyEmail({ email, label, copied }: { email: string; label: string; copied: string }) {
  const [on, setOn] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-spot"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
          } catch {
            const ta = document.createElement("textarea");
            ta.value = email;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          setOn(true);
          window.setTimeout(() => setOn(false), 1800);
        }}
      >
        {label}
      </button>
      <span className="toast" data-on={on} role="status" aria-live="polite">
        {on ? `${copied}: ${email}` : ""}
      </span>
    </>
  );
}

export function ContactForm({
  email,
  labels,
}: {
  email: string;
  labels: { title: string; name: string; message: string; send: string; hint: string };
}) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const href = `mailto:${email}?subject=${encodeURIComponent(name ? `${name} — elifgezgin` : "elifgezgin")}&body=${encodeURIComponent(msg)}`;
  return (
    <form
      className="mt-10 grid max-w-xl gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = href;
      }}
    >
      <h3 className="h3 display">{labels.title}</h3>
      <label className="field">
        {labels.name}
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="field">
        {labels.message}
        <textarea name="message" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} required />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn">
          {labels.send}
        </button>
        <span className="meta">{labels.hint}</span>
      </div>
    </form>
  );
}
