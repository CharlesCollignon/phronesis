/**
 * Données structurées schema.org (JSON-LD), lues par les moteurs de
 * recherche. `<` est échappé pour qu'un titre ne puisse pas fermer la
 * balise script.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown>;
}): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
