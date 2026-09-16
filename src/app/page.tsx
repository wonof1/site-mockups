import type { Metadata } from "next";
import StorefrontMockup from "@/components/storefront-mockup/StorefrontMockup";

export const metadata: Metadata = {
  title: "WON OF ONE — Never Unnoticed | Storefront Concept",
  description: "A clickable concept for the next WON OF ONE padel apparel storefront.",
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return <StorefrontMockup />;
}
