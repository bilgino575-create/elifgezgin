import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { homeMetadata } from "@/lib/meta";

export const metadata: Metadata = homeMetadata("en");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell lang="en">{children}</Shell>;
}
