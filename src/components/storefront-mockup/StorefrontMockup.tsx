"use client";

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, ChevronDown, Menu, Minus, Plus, ShoppingBag, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useDialogFocus } from '@/components/useDialogFocus';
import BrandIntro from './BrandIntro';
import EditorialCursor from './EditorialCursor';
import { products, collection, editions, categories, players, productVariant, productSizes, money, type Product } from './catalogue';
import './storefront.css';
import './collection-stage.css';
import './drop.css';

const subscribe = (cb: () => void) => { window.addEventListener('hashchange',cb); return () => window.removeEventListener('hashchange',cb); };
const snapshot = () => window.location.hash.slice(1) || 'home';
const productLink = (p: Product, colour?: string) => `#product/${p.id}/${encodeURIComponent(productVariant(p,colour).name)}`;
type CartLine = {key:string;product:Product;colour:string;size:string;quantity:number};

export default function StorefrontMockup() {
 const route = useSyncExternalStore(subscribe,snapshot,()=> '');
 const [view, id, colour] = route.split('/').map(s => { try {return decodeURIComponent(s);}catch{return s;} });
 const [menu,setMenu] = useState(false);
 const [mobile,setMobile] = useState(false);
 const [cart,setCart] = useState<CartLine[]>([]);
 const header = useRef<HTMLElement>(null);
 const dialog = useRef<HTMLDivElement>(null);
 const closeMobile = useCallback(()=>setMobile(false),[]);
 useDialogFocus(mobile,closeMobile,dialog);
 useEffect(()=> {window.scrollTo({top:0,behavior:'instant'});},[route]);
 useEffect(()=> {const outside=(e:PointerEvent)=>{if(!header.current?.contains(e.target as Node))setMenu(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
 const go=()=>{setMenu(false);setMobile(false);};
 const product=products.find(p=>p.id===id);
 const limited=view==='limited'||(view==='product'&&product?.limited);
 const count=cart.reduce((n,line)=>n+line.quantity,0);
 const add=(p:Product,c:string,s:string)=>{const key=`${p.id}-${c}-${s}`;setCart(lines=>lines.some(l=>l.key===key)?lines.map(l=>l.key===key?{...l,quantity:l.quantity+1}:l):[...lines,{key,product:p,colour:c,size:s,quantity:1}]);};
 // Hash routes are client-only: do not flash the home intro before hydration.
 if (!route) return <div className="wo-route-loading" aria-busy="true"/>;
 return <div className={`wo-store wo-drop${view==='home'?' wo-home':''}${limited?' wo-edition-site':''}`}>
  <EditorialCursor/>
  <header className="wo-header" ref={header} onKeyDown={e=>{if(e.key==='Escape'){setMenu(false);header.current?.querySelector<HTMLButtonElement>('.wo-products-toggle')?.focus();}}}>
   <a href="#home" onClick={go} className="wo-logo" aria-label="Won of One home"><Image src="/brand/won-of-one-logo.png" width={164} height={72} alt="WON OF ONE" priority/></a>
   <nav className="wo-desktop-nav" aria-label="Main navigation">
    <div className="wo-nav-group"><button className="wo-products-toggle" aria-expanded={menu} aria-controls="products-menu" onClick={()=>setMenu(!menu)}>Products <ChevronDown size={12}/></button>
    {menu&&<div className="wo-dropdown" id="products-menu"><a href="#shop" onClick={go}>All products <ArrowUpRight size={16}/></a>{categories.map(c=><a href={`#shop/${encodeURIComponent(c)}`} key={c} onClick={go}>{c}</a>)}<button onClick={()=>setMenu(false)} aria-label="Close products menu"><X size={18}/></button></div>}</div>
    <a href="#limited" onClick={go} aria-current={limited?'page':undefined}>Limited Edition</a><a href="#about" onClick={go}>About</a><a href="#contact" onClick={go}>Contact</a>
   </nav>
   <div className="wo-header-actions"><a href="#cart" onClick={go} className="wo-bag" aria-label={`Bag, ${count} items`}><ShoppingBag size={19}/><span>Bag ({count})</span></a><button className="wo-menu-toggle" aria-label="Open menu" onClick={()=>setMobile(true)}><Menu/></button></div>
  </header>
  {mobile&&<div className="wo-mobile" role="dialog" aria-label="Navigation" aria-modal="true" ref={dialog}><div className="wo-mobile-top"><b>WON OF ONE</b><button onClick={closeMobile} aria-label="Close menu"><X/></button></div><nav aria-label="Mobile navigation"><a href="#home" onClick={go}>Home</a><details open><summary>Products</summary><a href="#shop" onClick={go}>All products</a>{categories.map(c=><a key={c} href={`#shop/${encodeURIComponent(c)}`} onClick={go}>{c}</a>)}</details><a href="#limited" onClick={go}>Limited Edition</a><a href="#about" onClick={go}>About</a><a href="#contact" onClick={go}>Contact</a></nav></div>}
  <main>
   {view==='home'&&<><BrandIntro><div className="wo-drop-hero-label">WON OF ONE / THE COLLECTION</div><div className="wo-court-title"><h1>Never<br/><em>unnoticed.</em></h1></div><div className="wo-home-explore"><a href="#shop">Explore the collection <ArrowUpRight/></a><button onClick={()=>document.getElementById('collection')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>Scroll to discover ↓</button></div></BrandIntro><section id="collection" className="wo-catalogue"><div className="wo-catalogue-heading"><div><p className="wo-eyebrow">THE CLOTHING DROP</p><h2>On & off court.</h2></div><a href="#shop">All {collection.length} styles <ArrowUpRight size={18}/></a></div><Catalogue items={collection}/></section></>}
   {view==='shop'&&<section className="wo-catalogue"><div className="wo-catalogue-heading"><div><p className="wo-eyebrow">WON OF ONE / PRODUCTS</p><h1>{categories.includes(id)?id:'The collection.'}</h1></div><span>{collection.filter(p=>!categories.includes(id)||p.category===id).length} styles</span></div><nav className="wo-category-tabs" aria-label="Product categories"><a href="#shop" aria-current={!categories.includes(id)?'page':undefined}>All</a>{categories.map(c=><a key={c} href={`#shop/${encodeURIComponent(c)}`} aria-current={c===id?'page':undefined}>{c}</a>)}</nav><Catalogue items={collection.filter(p=>!categories.includes(id)||p.category===id)}/></section>}
   {view==='limited'&&<LimitedEdition/>}
   {view==='product'&&(product?<ProductDetail key={route} product={product} initialColour={colour} add={add}/>:<Empty/>) }
   {view==='about'&&<section className="wo-section wo-about"><p className="wo-eyebrow">WON OF ONE</p><h1>Never unnoticed.</h1><p>Padel apparel, on and off court.</p><a className="wo-text-link" href="#shop">Explore the collection <ArrowUpRight size={18}/></a></section>}
   {view==='contact'&&<Contact/>}
   {view==='cart'&&<section className="wo-section wo-cart"><p className="wo-eyebrow">YOUR SELECTION</p><h1>The bag. ({count})</h1>{!cart.length?<div className="wo-empty"><p>Your bag is empty.</p><a href="#shop" className="wo-text-link">Explore products <ArrowRight size={18}/></a></div>:<><div>{cart.map(line=><article className="wo-cart-line" key={line.key}><div className="wo-cart-photo"><ProductPhoto product={line.product} colour={line.colour}/></div><div><a href={productLink(line.product,line.colour)}><h3>{line.product.name}</h3></a><p>{line.colour} / {line.size}</p><div className="wo-quantity"><button aria-label={`Decrease ${line.product.name}`} onClick={()=>setCart(lines=>lines.map(l=>l.key===line.key?{...l,quantity:l.quantity-1}:l).filter(l=>l.quantity>0))}><Minus size={14}/></button><span>{line.quantity}</span><button aria-label={`Increase ${line.product.name}`} onClick={()=>setCart(lines=>lines.map(l=>l.key===line.key?{...l,quantity:l.quantity+1}:l))}><Plus size={14}/></button></div><button className="wo-remove" onClick={()=>setCart(lines=>lines.filter(l=>l.key!==line.key))}>Remove</button></div><span>{money(line.product.price)}</span></article>)}</div><a className="wo-button" href="#checkout">Preview checkout <ArrowRight size={18}/></a></>}</section>}
   {view==='checkout'&&<section className="wo-section wo-checkout"><p className="wo-eyebrow">CHECKOUT PREVIEW</p><h1>{count?'Your selection.':'Your bag is empty.'}</h1><p>Prices and availability will be confirmed before launch. This preview does not accept payments or place orders.</p><a href={count?'#cart':'#shop'} className="wo-text-link">{count?'Return to bag':'Explore products'} <ArrowRight size={18}/></a></section>}
   {!['home','shop','limited','product','about','contact','cart','checkout'].includes(view)&&<Empty/>}
  </main>
  <footer className="wo-footer"><a href="#home">WON OF ONE © {new Date().getFullYear()}</a><nav aria-label="Footer"><a href="#shop">Products</a><a href="#limited">Limited Edition</a><a href="#contact">Contact</a></nav><span>Design preview · No orders or payments</span></footer>
 </div>;
}

function ProductPhoto({product,colour,priority=false}:{product:Product;colour?:string;priority?:boolean}) {
 const variant=productVariant(product,colour);
 return <Image className="wo-drop-photo" src={variant.image} alt={`${product.name}, ${variant.name}${product.limited?', front and back artwork':''}`} width={1162} height={930} priority={priority} unoptimized/>;
}
function Catalogue({items}:{items:Product[]}) {return <div className="wo-drop-products">{items.map(p=><ProductCard key={p.id} product={p}/>)}</div>;}
function ProductCard({product}:{product:Product}) {
 const [colour,setColour]=useState(product.variants[0].name);
 return <article className="wo-drop-card"><a href={productLink(product,colour)} className="wo-drop-card-image"><ProductPhoto product={product} colour={colour}/><ArrowUpRight size={20}/></a><div className="wo-drop-card-copy"><a href={productLink(product,colour)}><h3>{product.name}</h3></a><span>{colour}</span></div><div className="wo-drop-swatches" aria-label={`${product.name} colours`}>{product.variants.map(v=><button key={v.name} onClick={()=>setColour(v.name)} aria-label={`${product.name} in ${v.name}`} aria-pressed={colour===v.name} title={v.name}><i style={{background:v.hex}}/></button>)}</div></article>;
}
function LimitedEdition() {
 const [player,setPlayer]=useState(players[0]);
 const [design,setDesign]=useState(0);
 const [zoom,setZoom]=useState(false);
 const reduced=useReducedMotion();
 const choices=editions.filter(p=>p.player===player);
 const current=choices[design];
 return <div className="le-world"><div className="le-masthead"><p>WON OF ONE <span>/ LIMITED EDITION</span></p><a href="#shop">The main collection <ArrowUpRight size={16}/></a></div><section className="le-intro"><p className="wo-eyebrow">LIMITED EDITION</p><h1>The Player <em>Series.</em></h1><span>Four players. Twelve designs.</span></section><nav className="le-players" aria-label="Player editions">{players.map((p,i)=><button key={p} aria-pressed={player===p} onClick={()=>{setPlayer(p);setDesign(0);setZoom(false);}}><small>0{i+1}</small>{p}</button>)}</nav><section className="le-viewer" aria-label={`${player} editions`}><div className="le-artwork"><AnimatePresence mode="wait" initial={false}><motion.div key={current.id} initial={{opacity:0,y:reduced?0:18}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduced?0:.35}} className={zoom?'le-artwork-inner is-zoomed':'le-artwork-inner'}><ProductPhoto product={current} priority/></motion.div></AnimatePresence><button className="le-zoom" aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?<ZoomOut size={17}/>:<ZoomIn size={17}/>} {zoom?'Full design':'Inspect artwork'}</button></div><aside className="le-selection"><p className="wo-eyebrow">PLAYER {String(players.indexOf(player)+1).padStart(2,'0')}</p><h2>{player}</h2><p className="le-description">Graphic tee<br/>Front & back artwork</p><div className="le-designs" aria-label={`${player} designs`}>{choices.map((p,i)=><button key={p.id} aria-pressed={i===design} onClick={()=>{setDesign(i);setZoom(false);}}><ProductPhoto product={p}/><span>0{i+1} <b>{p.variants[0].name}</b></span></button>)}</div><div className="le-current" aria-live="polite">Edition {String(design+1).padStart(2,'0')} / {current.variants[0].name}</div><a className="le-view-link" href={productLink(current)}>Explore this tee <ArrowUpRight size={22}/></a><p className="le-preview-note">Design preview. Release details to follow.</p></aside></section><div className="le-end"><span>WON OF ONE</span><p>Never unnoticed.</p><a href="#shop">Return to the collection <ArrowRight size={17}/></a></div></div>;
}
function ProductDetail({product,initialColour,add}:{product:Product;initialColour?:string;add:(p:Product,c:string,s:string)=>void}) {
 const [colour,setColour]=useState(productVariant(product,initialColour).name);
 const [size,setSize]=useState('');const [added,setAdded]=useState(false);const [zoom,setZoom]=useState(false);
 return <section className={`wo-section wo-product-detail${product.limited?' le-product-detail':''}`}><a className="wo-back" href={product.limited?'#limited':`#shop/${encodeURIComponent(product.category)}`}>← {product.limited?'Limited Edition':product.category}</a><div className="wo-detail-grid"><div><button className={`wo-detail-image wo-detail-zoom${zoom?' is-zoomed':''}`} aria-label={zoom?'Show full product':'Inspect product image'} aria-pressed={zoom} onClick={()=>setZoom(!zoom)}><ProductPhoto product={product} colour={colour} priority/></button><p className="wo-image-hint">Select the image to {zoom?'see the full design':'inspect the design'}.</p></div><div className="wo-detail-copy"><p className="wo-eyebrow">{product.limited?'LIMITED EDITION / PLAYER SERIES':product.category}</p><h1>{product.name}</h1><p className="wo-price">Price to be confirmed</p><fieldset><legend>Colour / {colour}</legend><div className="wo-colour-options">{product.variants.map(v=><button key={v.name} style={{background:v.hex}} aria-label={v.name} aria-pressed={colour===v.name} onClick={()=>{setColour(v.name);setAdded(false);}}/>)}</div></fieldset><fieldset><legend>Size</legend><div className="wo-sizes">{productSizes(product).map(s=><button key={s} aria-pressed={s===size} onClick={()=>{setSize(s);setAdded(false);}}>{s}</button>)}</div></fieldset><button className="wo-button" disabled={!size} onClick={()=>{add(product,colour,size);setAdded(true);}}>{size?'Add to sample bag':'Select a size'}<Plus size={17}/></button><div className="wo-added" role="status">{added&&<>Added to your sample bag. <a href="#cart">View bag ↗</a></>}</div><p className="wo-detail-note">Product concept. Final fit, sizes, pricing and release details are to be confirmed.</p></div></div></section>;
}
function Empty(){return <section className="wo-section wo-empty"><h1>Page not found.</h1><a href="#shop">Explore the collection</a></section>;}
function Contact(){const[sent,setSent]=useState(false);return <section className="wo-section wo-contact"><div><p className="wo-eyebrow">WON OF ONE</p><h1>Get in touch.</h1><p>This sample form does not send or save your information.</p></div><form onSubmit={e=>{e.preventDefault();setSent(true);}}><label>Name<input required name="name" autoComplete="name"/></label><label>Email<input required type="email" name="email" autoComplete="email"/></label><label>Message<textarea required rows={4}/></label><button className="wo-button">Preview inquiry <ArrowUpRight size={18}/></button><p role="status">{sent?'Preview complete. No message was sent.':''}</p></form></section>;}
