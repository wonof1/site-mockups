"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { productReturnPath, transitionHome, useProductTransitions } from "./useProductTransitions";
import { MobileMenu } from "./MobileMenu";
import { HeroMedia } from "./HeroMedia";
import { InstagramFeed } from "./InstagramFeed";
import catalogue from "./catalogue.json";
import { QuarterZipShowcase } from "./QuarterZipShowcase";
import { modelCrop, modelVariantIndex, productPhotos } from "./productMedia";
import assets from "./assets.json";
import { useStorePreferences } from "./StorePreferences";

type Product = (typeof catalogue)[number];
type Department = "men" | "women" | "accessories";
const departments: Department[] = ["men", "women", "accessories"];
const apparel = catalogue.filter(p => !p.limited && p.category !== "Accessories");
const accessories = catalogue.filter(p => !p.limited && p.category === "Accessories");
const editions = catalogue.filter(p => p.limited);
const categories = [...new Set(apparel.map(p => p.category))];
const players = ["Tapia", "Galán", "Coello", "Chingotto"];
const title = (s: string) => ({ men: "Men", women: "Women", accessories: "Accessories", limited: "Limited Edition" }[s] || s);
const product = (id: string) => catalogue.find(p => p.id === id)!;
const url = (p: Product, dept: string) => `/product/${dept}/${p.id}`;
const categoryUrl = (dept: string, category?: string) => `/${dept}${category ? "/" + encodeURIComponent(category) : ""}`;
function Photo({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

  function Breadcrumb({ children }: { children: ReactNode }) {
    return <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{children}</nav>;
  }

export default function Storefront() {
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
  const [photoSelection, setPhotoSelection] = useState({ key: "", index: 0 });
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
    ? productColour.index : selected[p.id] ?? modelVariantIndex(p.id, p.category === "Accessories" ? "accessories" : page === "women" || (page === "product" && parts[1] === "women") ? "women" : "men", p.variants);
  const variant = (p: Product) => p.variants[selectedIndex(p)];
  const choose = (p: Product, index: number) => {
    if (page === "product") setProductColour({ path: pathname, index });
    else setSelected(s => ({ ...s, [p.id]: index }));
    setPhotoSelection({ key: "", index: 0 });
    setEnlarged(false);
  };

  useEffect(() => {
    setOpen(null); setEnlarged(false); setPhotoSelection({ key: "", index: 0 });
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
    const photos = productPhotos(p.id, dept, colour);
    const crop = modelCrop(p.id);
    return <article key={p.id} className="product-card">
      <Link className={`picture${photos.length > 1 ? " model-picture" : ""}`} style={photos.length > 1 ? { "--model-crop-scale": crop.scale, "--model-crop-origin": crop.origin } as CSSProperties : undefined} href={url(p, dept)}>
        <Photo src={photos[0].src} alt={`${p.name}, ${colour.name}`} />
      </Link>
      <h2><Link href={url(p, dept)}>{p.name}</Link></h2><p className="card-colour">{colour.name}</p>{swatches(p)}
    </article>;
  }
  function Home() {
    return <>
      <section id="top" className="hero"><HeroMedia /><div className="hero-caption"><h1>WON OF ONE</h1><nav className="hero-links" aria-label="Shop apparel"><Link href="/men">Shop men</Link><Link href="/women">Shop women</Link></nav></div></section>
      <section className="home-selection" aria-labelledby="apparel-heading"><div className="section-heading"><h2 id="apparel-heading">Apparel</h2><nav aria-label="Shop all apparel"><Link className="text-link" href="/men">Shop men →</Link><Link className="text-link" href="/women">Shop women →</Link></nav></div><div className="featured-products">{["court-tee", "court-shorts", "logo-quarter-zip", "wordmark-sweatpants"].map(id => card(product(id), "men"))}</div></section>
      <section className="category-stories" aria-label="Shop by category">{[{ id: "wordmark-tee", category: "T-shirts", colour: 3 }, { id: "stripe-quarter-zip", category: "Quarter-zips", colour: 0 }].map(item => { const p = product(item.id), v = p.variants[item.colour]; return <article className="category-story" key={p.id}><Link className="story-image" href={categoryUrl("men", item.category)}><Photo src={v.image} alt={`${p.name}, ${v.name}`} /></Link><div className="story-caption"><h2>{item.category}</h2><nav aria-label={`Shop ${item.category.toLowerCase()}`}><Link href={categoryUrl("men", item.category)}>Men →</Link><Link href={categoryUrl("women", item.category)}>Women →</Link></nav></div></article>; })}</section>
      <section className="home-accessories" aria-labelledby="accessories-heading"><div className="section-heading"><h2 id="accessories-heading">Accessories</h2><Link className="text-link" href="/accessories">Shop all →</Link></div><div className="accessories-row">{accessories.map(p => {
        const colour = variant(p), photos = productPhotos(p.id, "accessories", colour), crop = modelCrop(p.id);
        return <Link key={p.id} className="accessory-item" href={url(p, "accessories")}><div className={`picture${photos.length > 1 ? " model-picture" : ""}`} style={photos.length > 1 ? { "--model-crop-scale": crop.scale, "--model-crop-origin": crop.origin } as CSSProperties : undefined}><Photo src={photos[0].src} alt={`${p.name}, ${colour.name}`} /></div><span>{p.name}</span></Link>;
      })}</div></section>
    </>;
  }
  function Collection({ dept, category }: { dept: Department; category?: string }) {
    const items = (dept === "accessories" ? accessories : apparel).filter(p => !category || p.category === category);
    return <section className="collection"><Breadcrumb>{category ? <><Link href={`/${dept}`}>{title(dept)}</Link><span>/</span><span>{category}</span></> : <span>{title(dept)}</span>}</Breadcrumb><h1>{category || title(dept)}</h1>{dept !== "accessories" && <><nav className="categories" aria-label={`${title(dept)} categories`}><Link href={`/${dept}`} aria-current={!category ? "page" : undefined}>All {dept}</Link>{categories.map(c => <Link key={c} href={categoryUrl(dept, c)} aria-current={c === category ? "page" : undefined}>{c}</Link>)}</nav><label className="mobile-filter"><select aria-label={`${title(dept)} category`} value={categoryUrl(dept, category)} onChange={e => { router.push(e.target.value, { scroll: false }); }}><option value={`/${dept}`}>All {dept}</option>{categories.map(c => <option key={c} value={categoryUrl(dept, c)}>{c}</option>)}</select></label></>}{dept === "men" && category === "Quarter-zips" ? <QuarterZipShowcase key={dept} department={dept} /> : <div className="products">{items.map(p => card(p, dept))}</div>}</section>;
  }
  function ProductPage({ p, dept }: { p: Product; dept: string }) {
    // Each player's supplied editions are colour choices on the same product page.
    // Keep the linked edition first so existing URLs still open their original colour.
    if (p.limited) {
      const alternatives = editions.filter(other => other.player === p.player && other.id !== p.id);
      p = { ...p, name: `${p.player} Graphic Tee`, variants: [...p.variants, ...alternatives.flatMap(other => other.variants)] };
    }
    const back = p.limited ? `/limited/${encodeURIComponent(p.player || players[0])}` : `/${dept}`;
    const category = p.limited ? back : categoryUrl(dept, dept === "accessories" ? undefined : p.category);
    const returnTo = productReturnPath(pathname, back);
    const returnLabel = returnTo === "/" ? "Home" : returnTo.startsWith("/limited") ? "Limited Edition" : decodeURIComponent(returnTo.split("/").filter(Boolean).map(title).join(" / "));
    const currentVariant = variant(p);
    const photos = p.category === "Quarter-zips"
      ? [{ src: currentVariant.image, label: "Product" }]
      : productPhotos(p.id, dept, currentVariant);
    const photoKey = `${pathname}:${currentVariant.name}`;
    const photoIndex = photoSelection.key === photoKey ? photoSelection.index : 0;
    const photo = photos[photoIndex] || photos[0];
    return <section className="product-page"><Breadcrumb><Link href={back}>{p.limited ? "Limited Edition" : title(dept)}</Link><span>/</span>{p.limited ? <span>{p.player}</span> : <Link href={category}>{p.category}</Link>}</Breadcrumb><div className="product-layout"><div className="product-title"><Link className="product-back" href={returnTo}>← {returnLabel}</Link><h1>{p.name}</h1></div><button className={`gallery${enlarged ? " enlarged" : ""}`} onClick={() => setEnlarged(!enlarged)} aria-label={`${enlarged ? "Reduce" : "Enlarge"} ${p.name}`} aria-pressed={enlarged}><Photo key={photo.src} src={photo.src} alt={`${p.name}, ${currentVariant.name}, ${photo.label.toLowerCase()} view`} eager /></button><div className="product-info"><p className="chosen">{variant(p).name}</p>{swatches(p)}{photos.length > 1 && <div className="product-views" role="group" aria-label="Product views">{photos.map((item, index) => <button key={item.label} type="button" aria-pressed={index === photoIndex} onClick={() => { setPhotoSelection({ key: photoKey, index }); setEnlarged(false); }}>{item.label}</button>)}</div>}<div className="product-controls"><button onClick={() => setEnlarged(!enlarged)}>{enlarged ? "Reduce image" : "Enlarge image"}</button></div><Link className="category-link" href={p.limited ? "/limited" : category}>{p.limited ? "All limited edition tees" : `All ${dept === "accessories" ? "accessories" : p.category.toLowerCase()}`} →</Link></div></div></section>;
  }
  function Limited({ player }: { player?: string }) {
    const current = players.includes(player || "") ? player! : players[0];
    const items = editions.filter(p => p.player === current), lead = items[0];
    return <section className="limited"><div className="limited-heading"><h1>Limited Edition</h1><nav className="players" aria-label="Players">{players.map(x => <Link key={x} href={`/limited/${encodeURIComponent(x)}`} aria-current={x === current ? "page" : undefined}>{x}</Link>)}</nav></div><div className="edition-lead"><div className="edition-title"><h2>{current}</h2><Link className="text-link" href={url(lead, "limited")}>View tee →</Link></div><Link className="edition-image" href={url(lead, "limited")}><Photo src={lead.variants[0].image} alt={lead.name} eager /></Link></div><div className="edition-designs">{items.map(p => <article key={p.id}><Link className="picture" href={url(p, "limited")}><Photo src={p.variants[0].image} alt={p.name} /></Link><h3><Link href={url(p, "limited")}>{p.name}</Link></h3><p>{p.variants[0].name}</p></article>)}</div></section>;
  }

  let content: ReactNode = Home();
  if (departments.includes(page as Department)) content = Collection({ dept: page as Department, category: parts[1] });
  else if (page === "product" && product(parts[2])) content = ProductPage({ p: product(parts[2]), dept: parts[1] });
  else if (page === "limited") content = Limited({ player: parts[1] });
  return <>
    <a className="skip" href="#main">Skip to content</a>{page !== "home" && <div className="strip" />}
    <div ref={navigation} onClickCapture={transitionToProduct} className={`site-navigation${page === "home" ? " home-navigation" : ""}${scrolled ? " is-scrolled" : ""}`} onPointerLeave={() => { if (window.innerWidth > 650) setOpen(null); }}>
      <header className="header"><svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}><defs><filter id="header-white-mark" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.2126 -0.7152 -0.0722 0 1" /><feComposite in2="SourceGraphic" operator="in" /></filter></defs></svg><button className="menu-button" aria-expanded={open === "all"} aria-haspopup="dialog" onClick={e => { trigger.current = e.currentTarget; setOpen(open ? null : "all"); }}>Menu</button><nav className="main-nav" aria-label="Shop">{departments.map(d => <Link key={d} href={`/${d}`} aria-expanded={open === d} aria-controls="menu" onPointerEnter={e => { if (e.pointerType === "mouse") { trigger.current = e.currentTarget; setOpen(d); } }} onFocus={e => { if (!suppressFocus.current && window.innerWidth > 650) { trigger.current = e.currentTarget; setOpen(d); } }} onKeyDown={e => { if (e.key === "ArrowDown") { e.preventDefault(); trigger.current = e.currentTarget; setOpen(d); requestAnimationFrame(() => menu.current?.querySelector("a")?.focus()); } }} onClick={() => setOpen(null)}>{title(d)}</Link>)}</nav><Link className="brand" href="/#top" aria-label="WON OF ONE home" onPointerEnter={() => setOpen(null)} onClick={e => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        setOpen(null);
        if (page === "home") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduced") ? "instant" : "smooth" });
        } else {
          e.preventDefault();
          transitionHome(() => router.push("/#top", { scroll: false }));
        }
      }}><Photo src={assets.logo} alt="WON OF ONE" eager /></Link><nav className="edition-nav" onPointerEnter={() => setOpen(null)}><Link href="/limited">Limited Edition</Link></nav></header>
      <div ref={menu} id="menu" className="menu" hidden={!open || open === "all"} onClick={() => setOpen(null)}>{(open === "all" ? departments : open ? [open] : []).map(d => <nav key={d} aria-label={`${title(d)} categories`}>{open === "all" && <strong><Link href={`/${d}`}>{title(d)}</Link></strong>}<Link href={`/${d}`}>Shop all {d}</Link>{d === "accessories" ? accessories.map(p => <Link key={p.id} href={url(p, d)}>{p.name}</Link>) : categories.map(c => <Link key={c} href={categoryUrl(d, c)}>{c}</Link>)}</nav>)}</div>
      <MobileMenu open={open === "all"} close={closeMenu} groups={departments.map(d => ({ label: title(d), href: `/${d}`, links: d === "accessories" ? accessories.map(p => ({ label: p.name, href: url(p, d) })) : categories.map(c => ({ label: c, href: categoryUrl(d, c) })) }))} />
    </div>
    <main id="main" ref={main} tabIndex={-1} onClickCapture={transitionToProduct}>{content}</main>
    {page === "home" && <InstagramFeed />}
    <footer className="live-footer"><span>WO1 · WON OF ONE</span><nav aria-label="Legal"><a href="https://wonof1.com/privacy/">Privacy</a><a href="https://wonof1.com/terms/">Terms</a></nav><span>© {new Date().getFullYear()}</span></footer>
  </>;
}
