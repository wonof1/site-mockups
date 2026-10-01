"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Group = { label: string; href: string; links: { label: string; href: string }[] };
export function MobileMenu({ open, close, groups }: { open: boolean; close: () => void; groups: Group[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (!open) { el.close(); return; }
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const resize = () => { if (innerWidth > 650) close(); };
    window.addEventListener("resize", resize);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("resize", resize); el.close(); };
  }, [open, close]);
  return <dialog ref={dialog} className="mobile-drawer" aria-label="Shop menu" onCancel={close} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right) close(); } }}>
    <div className="drawer-top"><span>WON OF ONE</span><button onClick={close} aria-label="Close menu" autoFocus>Close <span aria-hidden="true">×</span></button></div>
    <nav aria-label="Mobile shop departments" className="drawer-departments">
      {groups.map(group => <details key={group.label} name="shop-department"><summary>{group.label}<span aria-hidden="true" /></summary><div className="drawer-links"><Link href={group.href} onClick={close}>Shop all {group.label.toLowerCase()} <span aria-hidden="true">↗</span></Link>{group.links.map(link => <Link key={link.href} href={link.href} onClick={close}>{link.label}</Link>)}</div></details>)}
      <Link className="drawer-limited" href="/limited" onClick={close}>Limited Edition <span aria-hidden="true">↗</span></Link>
    </nav>
    <div className="drawer-bottom"><Link href="/#top" onClick={close}>Home</Link><a href="https://www.instagram.com/wo1_padel/" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>
  </dialog>;
}
