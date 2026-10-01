import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { works } from "@/lib/content";
import { workMetadata } from "@/lib/meta";
import WorkPage from "@/components/WorkPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = works.find((x) => x.slug === slug);
  return w ? workMetadata("en", w) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = works.find((x) => x.slug === slug);
  if (!w) notFound();
  return <WorkPage lang="en" work={w} />;
}
