"use client";

import { useState } from "react";
import type { BuyOption } from "./shopify";

export function PurchaseOptions({ options }: { options: BuyOption[] }) {
  const [href, setHref] = useState("");
  if (!options.length) return <p className="launch-status">Coming soon</p>;
  const selected = options.find(option => option.href === href);
  return <div className="launch-purchase">
    <label>Size
      <select value={selected?.href ?? ""} onChange={event => setHref(event.target.value)}>
        <option value="">Select a size</option>
        {options.map(option => <option key={option.href} value={option.href}>{option.size}</option>)}
      </select>
    </label>
    {selected ? <a className="buy-link" href={selected.href}>Buy now</a> : <button disabled>Buy now</button>}
  </div>;
}
