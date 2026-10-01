import { works } from "@/lib/content";
import { ogSize, workOg } from "@/lib/workOg";

export const alt = "Elif Gezgin — project";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return workOg("en", slug);
}
