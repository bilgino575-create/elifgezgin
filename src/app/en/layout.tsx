import type { Metadata } from "next";
import Shell from "@/components/site/Shell";
import { homeMetadata } from "@/lib/meta";

export const metadata: Metadata = homeMetadata("en");

export default function Layout({ children }: LayoutProps<"/en">) {
  return <Shell lang="en">{children}</Shell>;
}
