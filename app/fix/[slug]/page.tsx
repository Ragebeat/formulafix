import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Tool from "@/components/Tool";
import { getPage, seoPages } from "@/lib/seo-pages";

export function generateStaticParams() {
  return seoPages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getPage(params.slug);
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default function FixPage({ params }: { params: { slug: string } }) {
  const page = getPage(params.slug);
  if (!page) notFound();

  const related = seoPages.filter((p) => p.slug !== page.slug).slice(0, 3);

  return (
    <main className="container">
      <article className="prose seo-intro">
        <h1>{page.h1}</h1>
        {page.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>

      <Tool initialFormula={page.example} initialContext={page.exampleContext} />

      <section className="faq">
        <h2>Frequently asked</h2>
        {page.faq.map((f, i) => (
          <details key={i}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <section className="related">
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Related errors</h2>
        {related.map((p) => (
          <Link key={p.slug} href={`/fix/${p.slug}`}>
            {p.h1}
          </Link>
        ))}
      </section>
    </main>
  );
}
