import { useTranslations } from "next-intl";

type TermsSection = { title: string; body: (string | string[])[] };

export default function TermsContent() {
  const t = useTranslations("terms");
  const sections = t.raw("sections") as TermsSection[];

  return (
    <div className="grid gap-8 text-base leading-7 text-foreground">
      {sections.map((section, index) => (
        <section key={section.title} className="grid gap-3">
          <h2 className="title-section">
            § {index + 1}. {section.title}
          </h2>
          {section.body.map((block) =>
            Array.isArray(block) ? (
              <ul key={block[0]} className="grid list-disc gap-1.5 pl-6 marker:text-muted-foreground">
                {block.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p key={block}>{block}</p>
            ),
          )}
        </section>
      ))}
    </div>
  );
}
