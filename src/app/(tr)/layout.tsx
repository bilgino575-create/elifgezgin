import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { homeMetadata } from "@/lib/meta";

export const metadata: Metadata = homeMetadata("tr");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell lang="tr">{children}</Shell>;
}
