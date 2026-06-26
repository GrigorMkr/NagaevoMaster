import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks/LegalDocumentLinks';
import { LEGAL_DOCUMENTS, type LegalDocumentSlug } from '@/constants/legal';
import { LEGAL_DOCUMENT_CONTENT } from '@/data/legalDocuments';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import pageStyles from '@/styles/page.module.css';
import styles from './LegalDocumentPage.module.css';

interface LegalDocumentPageProps {
  slug: LegalDocumentSlug;
}

function LegalDocumentPage({ slug }: LegalDocumentPageProps) {
  const document = LEGAL_DOCUMENT_CONTENT[slug];
  const docMeta = LEGAL_DOCUMENTS.find((item) => item.slug === slug);

  return (
    <>
      <PageMeta
        title={document.title}
        description={document.description}
        canonical={docMeta?.path ?? '/privacy'}
      />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Документы" title={document.title} subtitle={`Редакция от ${document.updatedAt}`} />

          <Reveal delay={60}>
            <article className={styles.article}>
              {document.sections.map((section) => (
                <section key={section.heading ?? section.paragraphs[0]} className={styles.section}>
                  {section.heading ? <h2 className={styles.heading}>{section.heading}</h2> : null}
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className={styles.paragraph}>{paragraph}</p>
                  ))}
                  {section.list ? (
                    <ul className={styles.list}>
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </article>
          </Reveal>

          <Reveal delay={120}>
            <div className={styles.footerLinks}>
              <p className={styles.footerTitle}>Другие документы</p>
              <LegalDocumentLinks variant="stack" />
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}

export {
  LegalDocumentPage,
};