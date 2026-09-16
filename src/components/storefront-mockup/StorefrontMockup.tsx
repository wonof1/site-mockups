"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrandIntro from "./BrandIntro";
import EditorialCursor from "./EditorialCursor";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, ArrowRight, ChevronDown, Menu, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useDialogFocus } from "@/components/useDialogFocus";
import { categories, money, products, productColours, productCrop, sizes, type Audience, type Product } from "./catalogue";
import "./storefront.css";
import "./collection-stage.css";

const subscribe = (callback: () => void) => { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); };
const snapshot = () => window.location.hash.slice(1) || "home";
type CartLine = { key: string; product: Product; size: string; colour: string; quantity: number };

export default function StorefrontMockup() {
  const route = useSyncExternalStore(subscribe, snapshot, () => "home");
  const [dropdown, setDropdown] = useState<Audience | null>(null);
  const [mobile, setMobile] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notice, setNotice] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const closeMobile = useCallback(() => setMobile(false), []);
  useDialogFocus(mobile, closeMobile, mobileRef);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!navRef.current?.contains(event.target as Node)) setDropdown(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [route]);
  const go = () => { setDropdown(null); setMobile(false); setNotice(""); };
  const add = (product: Product, size: string, colour: string) => {
    const key = `${product.id}-${size}-${colour}`;
    setCart(current => current.some(line => line.key === key) ? current.map(line => line.key === key ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { key, product, size, colour, quantity: 1 }]);
    setNotice(`${product.name} added to your sample bag.`);
  };
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const [view, audience, category] = route.split("/").map(segment => { try { return decodeURIComponent(segment); } catch { return segment; } });
  const product = products.find(item => item.id === audience);
  const filtered = products.filter(item => (!audience || item.audience.toLowerCase() === audience.toLowerCase()) && (!category || item.category === category));
  const shopLink = (group: string, section?: string) => `#shop/${group.toLowerCase()}${section ? `/${encodeURIComponent(section)}` : ""}`;
  const links = <>{(["Men", "Women"] as Audience[]).map(group => <div className="wo-nav-group" key={group}><button aria-expanded={dropdown === group} aria-controls={`menu-${group}`} onClick={() => setDropdown(dropdown === group ? null : group)}>{group}<ChevronDown size={12} /></button>{dropdown === group && <div className="wo-dropdown" id={`menu-${group}`}><span className="wo-menu-label">{group}</span><div className="wo-menu-links">{categories[group].map(section => <a key={section} href={shopLink(group, section)} onClick={go}>{section}<ArrowUpRight size={17}/></a>)}<a className="wo-menu-all" onClick={go} href={shopLink(group)}>View all {group.toLowerCase()}</a></div><button className="wo-menu-dismiss" onClick={() => setDropdown(null)} aria-label={`Close ${group.toLowerCase()} menu`}><X size={18}/></button></div>}</div>)}<a href="#about" onClick={go}>About</a><a href="#contact" onClick={go}>Contact</a></>;

  return <div className={`wo-store${view === "home" ? " wo-home" : ""}`}>
    <EditorialCursor />
    <header className="wo-header" ref={navRef} onKeyDown={event => { if (event.key === "Escape") { setDropdown(null); (event.target as HTMLElement).closest(".wo-nav-group")?.querySelector("button")?.focus(); } }}>
      <a href="#home" onClick={go} className="wo-logo" aria-label="Won of One home"><Image src="/brand/won-of-one-logo.png" width={164} height={72} alt="WON OF ONE" priority /></a>
      <nav className="wo-desktop-nav" aria-label="Main navigation">{links}</nav>
      <div className="wo-header-actions"><a href="#cart" className="wo-bag" onClick={go} aria-label={`Bag, ${count} items`}><ShoppingBag size={19} strokeWidth={1.5} /><span>Bag ({count})</span></a><button className="wo-menu-toggle" aria-label="Open menu" onClick={() => setMobile(true)}><Menu size={23} /></button></div>
    </header>
    {mobile && <div className="wo-mobile" role="dialog" aria-modal="true" aria-label="Navigation" ref={mobileRef}><div className="wo-mobile-top"><b>WON OF ONE</b><button aria-label="Close menu" onClick={closeMobile}><X /></button></div><nav aria-label="Mobile navigation"><a href="#home" onClick={go}>Home</a>{(["Men", "Women"] as Audience[]).map(group => <details key={group}><summary>{group}<ChevronDown size={18} /></summary><a href={shopLink(group)} onClick={go}>Shop all {group}</a>{categories[group].map(section => <a key={section} href={shopLink(group, section)} onClick={go}>{section}</a>)}</details>)}<a href="#about" onClick={go}>About</a><a href="#contact" onClick={go}>Contact</a><a href="#cart" onClick={go}>Bag ({count})</a></nav></div>}
    <main>
      {view === "home" && <>
        <CollectionExperience />
      </>}
      {view === "shop" && <section className="wo-section wo-listing"><p className="wo-eyebrow">COLLECTION 001 / {audience || "ALL APPAREL"}</p><h1>{category || (audience ? `${audience === "men" ? "Men’s" : "Women’s"} apparel.` : "The first collection.")}</h1><p className="wo-muted">T-shirts, shorts, and skorts. Example apparel imagery shown.</p><div className="wo-filters"><div><a className={!audience ? "active" : ""} href="#shop">All apparel</a><a className={audience === "men" ? "active" : ""} href="#shop/men">Men</a><a className={audience === "women" ? "active" : ""} href="#shop/women">Women</a></div><span>{filtered.length} styles / {filtered.reduce((sum, item) => sum + productColours(item).length, 0)} colourways</span></div>{filtered.length ? <ProductGrid items={filtered} /> : <div className="wo-empty"><h2>No pieces here.</h2><p>Explore our four-piece collection.</p><a className="wo-text-link" href={shopLink(audience)}>Explore available pieces <ArrowRight size={18} /></a></div>}</section>}
      {view === "product" && (product ? <ProductDetail key={`${product.id}-${category}`} product={product} initialColour={category} add={add} notice={notice} /> : <section className="wo-section wo-empty"><h1>Piece not found.</h1><a href="#shop">Back to apparel</a></section>)}
      {view === "about" && <section className="wo-about wo-section"><p className="wo-eyebrow">WON OF ONE</p><h1>Never unnoticed.</h1><p>We’re a Canadian padel apparel brand. Our first collection starts with four pieces: men’s and women’s tees, shorts, and a skort.</p><a className="wo-text-link" href="#shop">View Collection 001 <ArrowUpRight size={15} /></a></section>}
      {view === "contact" && <ContactForm key={route} />}
      {view === "cart" && <section className="wo-section wo-cart"><p className="wo-eyebrow">YOUR SELECTION</p><h1>The bag. <span>({count})</span></h1>{!cart.length ? <div className="wo-empty"><ShoppingBag size={32} strokeWidth={1} /><h2>Your bag is empty.</h2><p>Select a piece from Collection 001.</p><a className="wo-button" href="#shop">Explore apparel <ArrowRight size={18} /></a></div> : <div className="wo-cart-layout"><div>{cart.map(line => <article className="wo-cart-line" key={line.key}><div className="wo-cart-photo"><ProductPhoto product={line.product} colour={line.colour} /></div><div><a href={`#product/${line.product.id}/${line.colour}`}><h3>{line.product.name}</h3></a><p>{line.product.audience} / {line.colour} / {line.size}</p><div className="wo-quantity"><button aria-label={`Decrease ${line.product.name} quantity`} onClick={() => setCart(current => current.map(item => item.key === line.key ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0))}><Minus size={14} /></button><span>{line.quantity}</span><button aria-label={`Increase ${line.product.name} quantity`} onClick={() => setCart(current => current.map(item => item.key === line.key ? { ...item, quantity: item.quantity + 1 } : item))}><Plus size={14} /></button></div><button className="wo-remove" onClick={() => setCart(current => current.filter(item => item.key !== line.key))}>Remove</button></div><strong>{money(line.product.price * line.quantity)}</strong></article>)}</div><aside className="wo-summary"><h2>Your bag summary</h2><p><span>Subtotal</span><strong>{money(subtotal)}</strong></p><p className="wo-muted">Pricing will be confirmed before launch.</p><a className="wo-button" href="#checkout">Preview checkout <ArrowRight size={18} /></a><small>No purchase will be made.</small></aside></div>}</section>}
      {view === "checkout" && <section className="wo-section wo-checkout"><p className="wo-eyebrow">CHECKOUT PREVIEW</p><h1>{cart.length ? "Looking good." : "Your bag is empty."}</h1><p>{cart.length ? "This is where secure checkout will begin when the collection launches. Prices are still to be confirmed." : "Add a sample piece to explore the shopping flow."}</p>{cart.length > 0 && <div className="wo-summary">{cart.map(line => <p key={line.key}><span>{line.product.name} × {line.quantity}<small>{line.colour} / {line.size}</small></span><strong>{money(line.product.price * line.quantity)}</strong></p>)}<p><b>Subtotal</b><b>{money(subtotal)}</b></p><p className="wo-muted">Prototype only. No payment details are collected and no order is placed.</p></div>}<a className="wo-text-link" href={cart.length ? "#cart" : "#shop"}>{cart.length ? "Back to your bag" : "Explore apparel"}<ArrowRight size={18} /></a></section>}
      {!["home", "shop", "product", "about", "contact", "cart", "checkout"].includes(view) && <section className="wo-section wo-empty"><h1>Let’s get you back on court.</h1><a href="#home">Return home</a></section>}
    </main>
    <footer className="wo-footer"><span>© {new Date().getFullYear()} WON OF ONE</span><nav aria-label="Footer"><a href="#about">About</a><a href="#contact">Contact</a></nav><span className="wo-footer-note">Design preview · No orders or payments</span></footer>
  </div>;
}

function ProductPhoto({ product, colour = "Navy" }: { product: Product; colour?: string }) {
  const [x, y, width, height] = productCrop(product, colour);
  return <div className="wo-garment" style={{ aspectRatio: `${width} / ${height}` }}>
    <Image src="/brand/collection-colourways.png" alt={`${product.audience}’s ${product.name} in ${colour.toLowerCase()}, example apparel photo`} width={1448} height={1086} unoptimized style={{ position: "absolute", width: `${1448 / width * 100}%`, height: `${1086 / height * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%`, maxWidth: "none" }} />
  </div>;
}

function CollectionExperience() {
  const [active, setActive] = useState<number | null>(null);
  const journey = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);
  const [colour, setColour] = useState("Navy");
  const reduced = useReducedMotion();
  const product = active === null ? null : products[active];
  const select = (index: number | null) => {
    const node = journey.current;
    if (!node) return;
    const step = node.offsetHeight / 5;
    window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY + (index === null ? 0 : index + 1) * step, behavior: reduced ? "instant" : "smooth" });
  };
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const node = journey.current;
      if (!node) return;
      const progress = Math.max(0, -node.getBoundingClientRect().top / (node.offsetHeight / 5));
      const index = Math.min(4, Math.floor(progress + 0.5)) - 1;
      const next = index < 0 ? null : index;
      if (activeRef.current !== next) { activeRef.current = next; setActive(next); setColour("Navy"); }
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
    return () => { window.removeEventListener("scroll", queue); window.removeEventListener("resize", queue); cancelAnimationFrame(frame); };
  }, []);
  const duration = reduced ? 0 : 0.85;
  return <div ref={journey} className={`wo-experience ${product ? "is-apparel" : "is-court"}`}>
    <BrandIntro>
      <div className="wo-stage-caption"><button onClick={() => select(null)} aria-pressed={active === null}>The court</button><span>Collection 001 / Padel apparel</span></div>
      <AnimatePresence initial={false}>
        {product ? <motion.div key="apparel" className="wo-apparel-stage" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration, ease: [0.76, 0, 0.24, 1] }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${product.id}-${colour}`} className="wo-garment-scene" initial={{ opacity: 0, y: reduced ? 0 : 45 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -30 }} transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <a className="wo-stage-garment" href={`#product/${product.id}/${colour}`} aria-label={`View ${product.audience}'s ${product.name} in ${colour}`}><ProductPhoto product={product} colour={colour} /></a>
              <div className="wo-stage-product" aria-live="polite"><span>{product.audience} / {String(active! + 1).padStart(2, "0")}</span><h1>{product.name}</h1><a href={`#product/${product.id}/${colour}`}>View piece <ArrowUpRight size={20} /></a></div>
            </motion.div>
          </AnimatePresence>
          <div className="wo-stage-colours" aria-label="Garment colour">{productColours(product).map(option => <button key={option.name} aria-pressed={colour === option.name} onClick={() => setColour(option.name)}><i style={{ background: option.hex }}/>{option.name}</button>)}</div>
          <button className="wo-stage-close" onClick={() => select(null)} aria-label="Return to the court"><X size={20}/></button>
        </motion.div> : <motion.div className="wo-court-title" key="court-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.3 }}><h1>Never<br/><em>unnoticed.</em></h1><p>WON OF ONE</p></motion.div>}
      </AnimatePresence>
      <nav className="wo-style-index" aria-label="Explore the four styles">{products.map((item, index) => <button key={item.id} aria-pressed={index === active} onClick={() => select(index)}><span className="wo-index-number">0{index + 1}</span><span><small>{item.audience}</small>{item.category === "T-shirts" ? "T-shirt" : item.category === "Shorts" ? "Shorts" : "Skort"}</span><ArrowUpRight size={20}/></button>)}</nav>
      <div className="wo-stage-foot"><span>Scroll to explore ↓</span><a href="#shop">View collection ↗</a><span>WON OF ONE © {new Date().getFullYear()}</span></div>
    </BrandIntro>
  </div>;
}

function ProductGrid({ items }: { items: readonly Product[] }) {
  const reduced = useReducedMotion();
  const variants = items.flatMap(product => productColours(product).map(colour => ({ product, colour })));
  return <div className="wo-product-grid">{variants.map(({ product, colour }, index) => {
    const href = `#product/${product.id}/${colour.name}`;
    return <motion.article className="wo-product-card" key={`${product.id}-${colour.name}`} initial={false} whileInView={reduced ? undefined : { opacity: [0.6, 1], y: [24, 0] }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.6, delay: (index % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}>
      <a href={href} className="wo-product-image"><ProductPhoto product={product} colour={colour.name} /><span className="wo-quick-view">View piece <ArrowUpRight size={15} /></span></a>
      <div className="wo-product-meta"><p>{product.audience} / {colour.name}</p><a href={href}><h3>{product.name}</h3></a><div className="wo-swatches">{productColours(product).map(option => <a key={option.name} href={`#product/${product.id}/${option.name}`} aria-label={`${product.name} in ${option.name}`} aria-current={option.name === colour.name ? "true" : undefined}><i style={{ background: option.hex }} /></a>)}</div></div>
    </motion.article>;
  })}</div>;
}

function ProductDetail({ product, initialColour, add, notice }: { product: Product; initialColour?: string; add: (product: Product, size: string, colour: string) => void; notice: string }) {
  const [size, setSize] = useState("");
  const [colour, setColour] = useState(productColours(product).some(item => item.name === initialColour) ? initialColour! : "Navy");
  return <section className="wo-section wo-product-detail"><a className="wo-back" href={`#shop/${product.audience.toLowerCase()}`}>← {product.audience}’s apparel</a><div className="wo-detail-grid"><div className="wo-detail-image"><ProductPhoto product={product} colour={colour} /></div><div className="wo-detail-copy"><p className="wo-eyebrow">{product.audience} / {product.category}</p><h1>{product.name}</h1><p className="wo-price">Price to be confirmed</p><p>{product.description}</p><fieldset><legend>Colour — {colour}</legend><div className="wo-colour-options">{productColours(product).map(item => <button key={item.name} aria-label={item.name} aria-pressed={colour === item.name} style={{ background: item.hex }} onClick={() => setColour(item.name)} />)}</div></fieldset><fieldset><legend>Size {size && `— ${size}`}</legend><div className="wo-sizes">{sizes.map(item => <button key={item} aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>)}</div></fieldset><button className="wo-button" disabled={!size} onClick={() => add(product, size, colour)}>{size ? "Add to sample bag" : "Select a size"}<Plus size={18} /></button><div className="wo-added" role="status">{notice && <>{notice} <a href="#cart">View bag <ArrowRight size={15} /></a></>}</div><details open><summary>Design notes</summary><p>Example apparel photo. Final product artwork, fabric, fit, and size availability are still to be confirmed.</p></details><details><summary>Delivery & returns</summary><p>This concept does not accept orders. Delivery timelines and the final returns policy will be added before apparel launches.</p></details></div></div></section>;
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  return <section className="wo-section wo-contact"><div><p className="wo-eyebrow">LET’S CONNECT</p><h1>Get in touch.</h1><p>For questions about the collection.</p><p className="wo-muted">This is a sample form. Nothing entered here is sent or saved.</p></div><form onSubmit={event => { event.preventDefault(); setSent(true); }}><label>Your name<input required name="name" autoComplete="name" placeholder="Name" /></label><label>Email address<input required name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label><label>Your message<textarea required name="message" rows={4} placeholder="How can we help?" /></label><button className="wo-button" type="submit">Preview inquiry <ArrowUpRight size={18} /></button><p role="status">{sent ? "Inquiry preview complete. In the live site, this would reach the WON OF ONE team. No message was sent." : ""}</p></form></section>;
}
