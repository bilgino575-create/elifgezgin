import type { Metadata } from "next";
import Shell from "@/components/site/Shell";
import { homeMetadata } from "@/lib/meta";

export const metadata: Metadata = homeMetadata("tr");

export default function Layout({ children }: LayoutProps<"/">) {
  return <Shell lang="tr">{children}</Shell>;
}
