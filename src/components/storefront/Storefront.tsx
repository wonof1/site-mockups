"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { productReturnPath, transitionHome, useProductTransitions } from "./useProductTransitions";
import { MobileMenu } from "./MobileMenu";
import { HeroMedia } from "./HeroMedia";
import { InstagramFeed } from "./InstagramFeed";
import { catalogue, departments, departmentCategories, departmentProducts, formatPrice, isDepartment, type Department, type Product } from "./catalog";
import { PurchaseOptions } from "./PurchaseOptions";
import type { BuyOption } from "./shopify";
import { ClothingRail } from "./ClothingRail";
import assets from "./assets.json";
import { useStorePreferences } from "./StorePreferences";

const title = (s: string) => ({ men: "Men", women: "Women", unisex: "Unisex" }[s] || s);
const url = (p: Product, dept: string) => `/product/${dept}/${p.id}`;
const categoryUrl = (dept: string, category?: string) => `/${dept}${category ? "/" + encodeURIComponent(category) : ""}`;
function Photo({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

  function Breadcrumb({ children }: { children: ReactNode }) {
    return <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{children}</nav>;
  }

export default function Storefront({ buyOptions = [] }: { buyOptions?: BuyOption[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const transitionToProduct = useProductTransitions(pathname, router);
  const parts = pathname.split("/").filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch { return s; } });
  const page = parts[0] || "home";
  const [selected, setSelected] = useStorePreferences();
  const [productColour, setProductColour] = useState<{ path: string; index: number } | null>(null);
  const [open, setOpen] = useState<Department | "all" | null>(null);
  const closeMenu = useCallback(() => setOpen(null), []);
  const [enlarged, setEnlarged] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);
  const main = useRef<HTMLElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const suppressFocus = useRef(false);
  const previousPath = useRef(pathname);
  // Trying a colour on the detail page must not overwrite the originating card.
  const selectedIndex = (p: Product) => page === "product" && p.id === parts[2] && productColour?.path === pathname
    ? productColour.index : selected[p.id] ?? 0;
  const variant = (p: Product) => p.variants[selectedIndex(p)];
  const choose = (p: Product, index: number) => {
    if (page === "product") setProductColour({ path: pathname, index });
    else setSelected(s => ({ ...s, [p.id]: index }));
    setEnlarged(false);
  };

  useEffect(() => {
    setOpen(null); setEnlarged(false);
    setProductColour(null);
    if (previousPath.current !== pathname) main.current?.focus({ preventScroll: true });
    previousPath.current = pathname;
  }, [pathname]);
  useEffect(() => {
    const closeOutside = (e: Event) => { if (!navigation.current?.contains(e.target as Node)) setOpen(null); };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null); setEnlarged(false);
      if (navigation.current?.contains(document.activeElement)) {
        suppressFocus.current = true; trigger.current?.focus(); suppressFocus.current = false;
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", escape);
    if (new URLSearchParams(location.search).get("motion") === "reduce") document.documentElement.classList.add("reduced");
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("focusin", closeOutside); document.removeEventListener("keydown", escape); document.documentElement.classList.remove("reduced"); };
  }, []);

  function swatches(p: Product) {
    return <div className="swatches" aria-label={`${p.name} colours`}>{p.variants.map((v, i) => <button key={v.name} className="swatch" aria-label={v.name} aria-pressed={selectedIndex(p) === i} style={{ "--colour": v.hex } as CSSProperties} onClick={() => choose(p, i)}><i /></button>)}</div>;
  }
  function card(p: Product, dept: string) {
    const colour = variant(p);
    return <article key={p.id} className="product-card">
      <Link className="picture" href={url(p, dept)}>
        <Photo src={colour.image} alt={`${p.name}, ${colour.name}`} />
      </Link>
      <h2><Link href={url(p, dept)}>{p.name}</Link></h2><p className="card-colour">{colour.name}</p><p className="card-price">{formatPrice(p.price)}</p>{swatches(p)}
    </article>;
  }
  function Home() {
    return <>
      <section id="top" className="hero"><HeroMedia /><div className="hero-caption"><h1>WON OF ONE</h1><nav className="hero-links" aria-label="Shop apparel"><Link href="/men">Shop men</Link><Link href="/women">Shop women</Link></nav></div></section>
      <ClothingRail>{catalogue.map(p => card(p, p.audience.toLowerCase()))}</ClothingRail>
      <section className="category-stories" aria-label="Shop by category">
        {catalogue.filter(p => p.id === "men-s-athletic-shorts-wo1" || p.id === "women-s-cross-back-tank-won-of-one").map(p => {
          const href = categoryUrl(p.audience.toLowerCase(), p.category);
          const colour = p.variants[0];
          return <article className="category-story" key={p.id}>
            <Link className="story-image" href={href}><Photo src={colour.image} alt={`${p.name}, ${colour.name}`} /></Link>
            <div className="story-caption"><h2>{p.category}</h2><Link href={href}>Shop {p.audience.toLowerCase()}’s {p.category.toLowerCase()} →</Link></div>
          </article>;
        })}
      </section>
    </>;
  }
  function Collection({ dept, category }: { dept: Department; category?: string }) {
    const categories = departmentCategories(dept);
    const items = departmentProducts(dept).filter(p => !category || p.category === category);
    return <section className="collection"><Breadcrumb>{category ? <><Link href={`/${dept}`}>{title(dept)}</Link><span>/</span><span>{category}</span></> : <span>{title(dept)}</span>}</Breadcrumb><h1>{category || title(dept)}</h1><nav className="categories" aria-label={`${title(dept)} categories`}><Link href={`/${dept}`} aria-current={!category ? "page" : undefined}>All {dept}</Link>{categories.map(c => <Link key={c} href={categoryUrl(dept, c)} aria-current={c === category ? "page" : undefined}>{c}</Link>)}</nav><label className="mobile-filter"><select aria-label={`${title(dept)} category`} value={categoryUrl(dept, category)} onChange={e => { router.push(e.target.value, { scroll: false }); }}><option value={`/${dept}`}>All {dept}</option>{categories.map(c => <option key={c} value={categoryUrl(dept, c)}>{c}</option>)}</select></label><div className="products">{items.map(p => card(p, dept))}</div></section>;
  }
  function ProductPage({ p, dept }: { p: Product; dept: string }) {
    const back = `/${dept}`;
    const category = categoryUrl(dept, p.category);
    const returnTo = productReturnPath(pathname, back);
    const returnLabel = returnTo === "/" ? "Home" : decodeURIComponent(returnTo.split("/").filter(Boolean).map(title).join(" / "));
    const colour = variant(p);
    return <section className="product-page">
      <Breadcrumb><Link href={back}>{title(dept)}</Link><span>/</span><Link href={category}>{p.category}</Link></Breadcrumb>
      <div className="product-layout">
        <div className="product-title"><Link className="product-back" href={returnTo}>← {returnLabel}</Link><h1>{p.name}</h1></div>
        <button className={`gallery${enlarged ? " enlarged" : ""}`} onClick={() => setEnlarged(!enlarged)} aria-label={`${enlarged ? "Reduce" : "Enlarge"} ${p.name}`} aria-pressed={enlarged}>
          <Photo src={colour.image} alt={`${p.name}, ${colour.name}`} eager />
        </button>
        <div className="product-info">
          <p className="detail-price">{formatPrice(p.price)}</p>
          <p className="chosen">{colour.name}</p>{swatches(p)}
          <PurchaseOptions key={colour.sku} options={buyOptions.filter(o => o.colour.toLowerCase() === colour.name.toLowerCase())} />
          <div className="product-controls"><button onClick={() => setEnlarged(!enlarged)}>{enlarged ? "Reduce image" : "Enlarge image"}</button></div>
          <Link className="category-link" href={category}>All {p.category.toLowerCase()} →</Link>
        </div>
      </div>
    </section>;
  }

  let content: ReactNode;
  if (isDepartment(page)) content = Collection({ dept: page, category: parts[1] });
  else if (page === "product") {
    const p = catalogue.find(item => item.id === parts[2]);
    if (p) content = ProductPage({ p, dept: parts[1] });
  } else if (page === "home") content = Home();
  return <>
    <a className="skip" href="#main">Skip to content</a>{page !== "home" && <div className="strip" />}
    <div ref={navigation} onClickCapture={transitionToProduct} className={`site-navigation${page === "home" ? " home-navigation" : ""}${scrolled ? " is-scrolled" : ""}`} onPointerLeave={() => { if (window.innerWidth > 650) setOpen(null); }}>
      <header className="header"><svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}><defs><filter id="header-white-mark" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.2126 -0.7152 -0.0722 0 1" /><feComposite in2="SourceGraphic" operator="in" /></filter></defs></svg><button className="menu-button" aria-expanded={open === "all"} aria-haspopup="dialog" onClick={e => { trigger.current = e.currentTarget; setOpen(open ? null : "all"); }}>Menu</button><nav className="main-nav" aria-label="Shop">{departments.filter(d => d !== "unisex").map(d => <Link key={d} href={`/${d}`} aria-expanded={open === d} aria-controls="menu" onPointerEnter={e => { if (e.pointerType === "mouse") { trigger.current = e.currentTarget; setOpen(d); } }} onFocus={e => { if (!suppressFocus.current && window.innerWidth > 650) { trigger.current = e.currentTarget; setOpen(d); } }} onKeyDown={e => { if (e.key === "ArrowDown") { e.preventDefault(); trigger.current = e.currentTarget; setOpen(d); requestAnimationFrame(() => menu.current?.querySelector("a")?.focus()); } }} onClick={() => setOpen(null)}>{title(d)}</Link>)}</nav><Link className="brand" href="/#top" aria-label="WON OF ONE home" onPointerEnter={() => setOpen(null)} onClick={e => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        setOpen(null);
        if (page === "home") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduced") ? "instant" : "smooth" });
        } else {
          e.preventDefault();
          transitionHome(() => router.push("/#top", { scroll: false }));
        }
      }}><Photo src={assets.logo} alt="WON OF ONE" eager /></Link><nav className="edition-nav" onPointerEnter={() => setOpen(null)}><Link href="/unisex">Unisex</Link></nav></header>
      <div ref={menu} id="menu" className="menu" hidden={!open || open === "all"} onClick={() => setOpen(null)}>{(open === "all" ? departments : open ? [open] : []).map(d => <nav key={d} aria-label={`${title(d)} categories`}>{open === "all" && <strong><Link href={`/${d}`}>{title(d)}</Link></strong>}<Link href={`/${d}`}>Shop all {d}</Link>{departmentCategories(d).map(c => <Link key={c} href={categoryUrl(d, c)}>{c}</Link>)}</nav>)}</div>
      <MobileMenu open={open === "all"} close={closeMenu} groups={departments.map(d => ({ label: title(d), href: `/${d}`, links: departmentCategories(d).map(c => ({ label: c, href: categoryUrl(d, c) })) }))} />
    </div>
    <main id="main" ref={main} tabIndex={-1} onClickCapture={transitionToProduct}>{content}</main>
    {page === "home" && <InstagramFeed />}
    <footer className="live-footer"><span>WO1 · WON OF ONE</span><nav aria-label="Legal"><a href="https://wonof1.com/privacy/">Privacy</a><a href="https://wonof1.com/terms/">Terms</a></nav><span>© {new Date().getFullYear()}</span></footer>
  </>;
}
