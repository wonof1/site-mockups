import type { Metadata } from "next";
import Storefront from "@/components/storefront/Storefront";

export const metadata: Metadata = {
  title: "WON OF ONE | Padel Apparel",
  description: "Explore WON OF ONE apparel, accessories and limited edition graphic tees.",
  robots: { index: false, follow: false },
};
export default function HomePage() { return <Storefront />; }
