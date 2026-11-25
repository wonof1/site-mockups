"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { productReturnPath, transitionHome, useProductTransitions } from "./useProductTransitions";
import { MobileMenu } from "./MobileMenu";
import { HeroMedia } from "./HeroMedia";
import { InstagramFeed } from "./InstagramFeed";
import { backImage, catalogue, departments, departmentCategories, departmentProducts, formatPrice, isDepartment, photoStatus, photoStatusLabel, type Department, type Product, type Variant } from "./catalog";
import { PurchaseOptions } from "./PurchaseOptions";
import type { BuyOption } from "./shopify";
import { ClothingRail } from "./ClothingRail";
import assets from "./assets.json";
import { useStorePreferences } from "./StorePreferences";
import { scrollBehavior } from "./motion";

const title = (s: string) => ({ men: "Men", women: "Women", unisex: "Unisex" }[s] || s);
const url = (p: Product, dept: string) => `/product/${dept}/${p.id}`;
const categoryUrl = (dept: string, category?: string) => `/${dept}${category ? "/" + encodeURIComponent(category) : ""}`;
function Photo({ src, alt, eager = false, className }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return <img src={src} alt={alt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

function Breadcrumb({ children }: { children: ReactNode }) {
  return <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>{children}</nav>;
}

// Placeholder and preview art stays labelled wherever it appears.
function PhotoFlag({ variant }: { variant: Variant }) {
  const label = photoStatusLabel[photoStatus(variant)];
  return label ? <span className="photo-flag">{label}</span> : null;
}
function altText(p: Product, v: Variant, view?: string) {
  const status = photoStatus(v);
  const note = status === "placeholder" ? " (placeholder image)" : status === "preview" ? " (colour preview)" : "";
  return `${p.name}, ${v.name}${view ? `, ${view}` : ""}${note}`;
}
// Each route remounts Storefront, so the previous path must outlive the component.
let lastPath: string | null = null;
const styleCount = catalogue.length;
const colourCount = catalogue.reduce((sum, p) => sum + p.variants.length, 0);

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
  const [backViewSku, setBackViewSku] = useState<string | null>(null);
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
  // Trying a colour on the detail page must not overwrite the originating card.
  const selectedIndex = (p: Product) => page === "product" && p.id === parts[2] && productColour?.path === pathname
    ? productColour.index : selected[p.id] ?? 0;
  const variant = (p: Product) => p.variants[selectedIndex(p)];
  const choose = (p: Product, index: number) => {
    if (page === "product") setProductColour({ path: pathname, index });
    else setSelected(s => ({ ...s, [p.id]: index }));
    setBackViewSku(null);
    setEnlarged(false);
  };

  useEffect(() => {
    setOpen(null); setEnlarged(false);
    setProductColour(null);
    setBackViewSku(null);
    const from = lastPath;
    lastPath = pathname;
    if (from && from !== pathname) {
      // Coming back from a product, resume on the card the shopper opened.
      const links = from.startsWith("/product/") ? Array.from(main.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []).filter(a => a.getAttribute("href") === from) : [];
      const card = links.find(a => a.closest("h2")) ?? links[0];
      (card ?? main.current)?.focus({ preventScroll: true });
    }
  }, [pathname]);

  // Warm the next likely photos: this colour's back view and every other colour's front.
  const viewing = page === "product" ? catalogue.find(item => item.id === parts[2]) : undefined;
  const viewingSku = viewing ? variant(viewing).sku : undefined;
  useEffect(() => {
    if (!viewing) return;
    const current = viewing.variants.find(v => v.sku === viewingSku);
    const urls: string[] = [current && backImage(current), ...viewing.variants.filter(v => v !== current).map(v => v.image)]
      .flatMap(src => typeof src === "string" ? [src] : []);
    const timer = window.setTimeout(() => urls.forEach(src => { const img = new Image(); img.decoding = "async"; img.src = src; }), 250);
    return () => clearTimeout(timer);
  }, [viewing, viewingSku]);

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
    return <div className="swatches" role="group" aria-label={`${p.name} colours`}>{p.variants.map((v, i) => <button key={v.name} className="swatch" aria-label={v.name} title={v.name} aria-pressed={selectedIndex(p) === i} style={{ "--colour": v.hex } as CSSProperties} onClick={() => choose(p, i)}><i /></button>)}</div>;
  }
  function card(p: Product, dept: string) {
    const colour = variant(p);
    const back = backImage(colour);
    return <article key={p.id} className="product-card">
      <Link className={`picture${back ? " has-back" : ""}`} href={url(p, dept)}>
        <Photo src={colour.image} alt={altText(p, colour, back ? "front" : undefined)} />
        {back && <Photo className="card-back" src={back} alt="" />}
        <PhotoFlag variant={colour} />
      </Link>
      <h2><Link href={url(p, dept)}>{p.name}</Link></h2>
      <p className="card-price">{formatPrice(p.price)}</p>
      <p className="card-colour">{colour.name}<span aria-hidden="true"> · </span>{p.variants.length} colours</p>
      {p.treatment && <p className="card-treatment">{p.treatment.mark}</p>}
      {swatches(p)}
    </article>;
  }
  function Home() {
    return <>
      <section id="top" className="hero"><HeroMedia /><div className="hero-caption"><div className="hero-title"><p className="hero-eyebrow">Collection 001 · Padel apparel</p><h1>WON OF ONE</h1></div><nav className="hero-links" aria-label="Shop apparel"><Link href="/men">Shop men</Link><Link href="/women">Shop women</Link></nav></div></section>
      <ClothingRail title="Collection 001" count={styleCount} summary={<>{styleCount} styles · {colourCount} colourways</>}>{catalogue.map(p => card(p, p.audience.toLowerCase()))}</ClothingRail>
      <section className="category-stories" aria-label="Shop by category">
        {/* Shorts lead with M02's verified photography; tanks only have placeholders and say so. */}
        {([["men-s-athletic-shorts-won-of-one", "Khaki"], ["women-s-cross-back-tank-won-of-one", "Black"]] as const).map(([id, colourName]) => {
          const p = catalogue.find(item => item.id === id);
          if (!p) return null;
          const href = categoryUrl(p.audience.toLowerCase(), p.category);
          const colour = p.variants.find(v => v.name === colourName) ?? p.variants[0];
          return <article className="category-story" key={p.id}>
            <Link className="story-image" href={href} tabIndex={-1} aria-hidden="true"><Photo src={colour.image} alt="" /><PhotoFlag variant={colour} /></Link>
            <div className="story-caption"><h2>{p.category}</h2><Link href={href}>Shop {p.audience.toLowerCase()}’s {p.category.toLowerCase()} →</Link></div>
          </article>;
        })}
      </section>
    </>;
  }
  function Collection({ dept, category }: { dept: Department; category?: string }) {
    const categories = departmentCategories(dept);
    const items = departmentProducts(dept).filter(p => !category || p.category === category);
    return <section className="collection">
      <Breadcrumb>{category ? <><Link href={`/${dept}`}>{title(dept)}</Link><span aria-hidden="true">/</span><span aria-current="page">{category}</span></> : <span aria-current="page">{title(dept)}</span>}</Breadcrumb>
      <div className="collection-heading"><h1>{category || title(dept)}</h1><p>{items.length} {items.length === 1 ? "style" : "styles"}</p></div>
      <nav className="categories" aria-label={`${title(dept)} categories`}><Link href={`/${dept}`} aria-current={!category ? "page" : undefined}>All {dept}</Link>{categories.map(c => <Link key={c} href={categoryUrl(dept, c)} aria-current={c === category ? "page" : undefined}>{c}</Link>)}</nav>
      <label className="mobile-filter"><select aria-label={`${title(dept)} category`} value={categoryUrl(dept, category)} onChange={e => { router.push(e.target.value, { scroll: false }); }}><option value={`/${dept}`}>All {dept}</option>{categories.map(c => <option key={c} value={categoryUrl(dept, c)}>{c}</option>)}</select></label>
      <div className="products">{items.map(p => card(p, dept))}</div>
    </section>;
  }
  function ProductPage({ p, dept }: { p: Product; dept: string }) {
    const back = `/${dept}`;
    const category = categoryUrl(dept, p.category);
    const returnTo = productReturnPath(pathname, back);
    const returnLabel = returnTo === "/" ? "Home" : decodeURIComponent(returnTo.split("/").filter(Boolean).map(title).join(" / "));
    const colour = variant(p);
    const backSrc = backImage(colour);
    const showingBack = backSrc !== undefined && backViewSku === colour.sku;
    const status = photoStatus(colour);
    const views = backSrc ? [{ label: "Front", src: colour.image, back: false }, { label: "Back", src: backSrc, back: true }] : [];
    const current = showingBack && backSrc ? backSrc : colour.image;
    return <section className="product-page">
      <Breadcrumb><Link href={back}>{title(dept)}</Link><span aria-hidden="true">/</span><Link href={category}>{p.category}</Link></Breadcrumb>
      <div className={`product-layout${enlarged ? " is-enlarged" : ""}`}>
        <div className="product-title">
          <Link className="product-back" href={returnTo}>← {returnLabel}</Link>
          <h1>{p.name}</h1>
          {p.treatment && <p className="product-treatment">{p.treatment.detail}</p>}
        </div>
        <div className="gallery-stage">
          <button className={`gallery${enlarged ? " enlarged" : ""}`} onClick={() => setEnlarged(!enlarged)} aria-label={`${enlarged ? "Reduce" : "Enlarge"} ${p.name}`} aria-pressed={enlarged}>
            <Photo key={current} src={current} alt={altText(p, colour, views.length ? (showingBack ? "back" : "front") : undefined)} eager />
            <PhotoFlag variant={colour} />
          </button>
          {views.length > 0 && <div className="gallery-thumbs" role="group" aria-label={`${colour.name} views`}>
            {views.map(view => <button key={view.label} aria-pressed={view.back === showingBack} onClick={() => setBackViewSku(view.back ? colour.sku : null)}>
              <span className="thumb-frame"><img src={view.src} alt="" decoding="async" /></span><span>{view.label}</span>
            </button>)}
          </div>}
        </div>
        <div className="product-info">
          <p className="detail-price">{formatPrice(p.price)}</p>
          <p className="chosen"><span>Colour</span> {colour.name}</p>{swatches(p)}
          {status !== "photo" && <p className="photo-note">{status === "preview" ? "Colour preview shown." : "Placeholder image shown."} Product photography for this colour is pending.</p>}
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
          window.scrollTo({ top: 0, behavior: scrollBehavior() });
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
