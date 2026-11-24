import type { Metadata } from "next";
import Storefront from "@/components/storefront/Storefront";

export const metadata: Metadata = {
  title: "WON OF ONE | Padel Apparel",
  description: "Explore Collection 001 from Won of One, including athletic tees, shorts, tanks, leggings and unisex boxy tees.",
  robots: { index: false, follow: false },
};
export default function HomePage() { return <Storefront />; }
