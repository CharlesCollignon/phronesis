// Utilitaire de développement : affiche les premières entrées d'un zip.
// Usage : tsx scripts/ingest/inspect.ts <zip> <motif> [n]
import { forEachZipEntry } from "./lib";

async function main(): Promise<void> {
  const [zipPath, pattern, nRaw] = process.argv.slice(2);
  const max = nRaw ? parseInt(nRaw, 10) : 1;
  let seen = 0;

  await forEachZipEntry(
    zipPath,
    (p) => seen < max && p.includes(pattern),
    (p, content) => {
      seen++;
      console.log(`\n===== ${p} =====`);
      console.log(content.slice(0, 6000));
      if (seen >= max) process.exit(0);
    },
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
