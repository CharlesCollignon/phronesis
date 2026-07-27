/**
 * Orchestre l'ingestion complète dans l'ordre des dépendances FK.
 * Usage : pnpm ingest
 */
import { spawn } from "node:child_process";
import path from "node:path";

const STEPS = [
  "acteurs.ts",
  "dossiers.ts",
  "scrutins.ts",
  "amendements.ts",
  "senat.ts",
] as const;

function run(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = path.join("scripts", "ingest", script);
    console.log(`\n========== ${script} ==========`);
    const child = spawn(
      "pnpm",
      ["exec", "tsx", "--env-file=.env", file],
      { stdio: "inherit", shell: true },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} a échoué (code ${code})`));
    });
  });
}

async function main(): Promise<void> {
  for (const step of STEPS) {
    await run(step);
  }
  console.log("\nIngestion complète terminée.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
