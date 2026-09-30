import type { Metadata } from "next";
import WorkPage from "@/components/site/WorkPage";
import { works } from "@/lib/content";
import { workMetadata } from "@/lib/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: PageProps<"/en/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return workMetadata("en", slug);
}

export default async function Page({ params }: PageProps<"/en/work/[slug]">) {
  const { slug } = await params;
  return <WorkPage lang="en" slug={slug} />;
}
