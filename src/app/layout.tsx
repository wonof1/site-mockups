import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StorePreferences } from "@/components/storefront/StorePreferences";
import "./globals.css";
import Arrival from "@/components/storefront/Arrival";
import { arrivalBootstrap } from "@/components/storefront/arrival-bootstrap";
export const metadata: Metadata = {
  title: "WON OF ONE | Padel Apparel",
  description: "Explore WON OF ONE apparel, accessories and limited edition graphic tees.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500&display=swap" /><script dangerouslySetInnerHTML={{ __html: arrivalBootstrap }} /><noscript><style>{".arrival{display:none!important}html[data-arrival] .header .brand img{visibility:visible!important}html[data-arrival] .hero>img,html[data-arrival] .hero-caption,html[data-arrival] .header{opacity:1!important;transform:none!important}"}</style></noscript></head><body><Arrival /><StorePreferences>{children}</StorePreferences></body></html>;
}
