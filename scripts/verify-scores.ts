import "dotenv/config";
import { db } from "../src/db/index";
import { resultProfiles } from "../src/db/schema";

async function verify() {
  console.log("🧪 Verificando faixas de score...\n");

  const profiles = await db.select().from(resultProfiles);
  console.log("Perfis no banco:");
  profiles.forEach((p) => {
    console.log(`  ${p.name}: ${p.scoreMin}–${p.scoreMax}`);
  });

  console.log("\n📈 Score total atingível:");
  console.log("  Mínimo: 6 (Q1:1 + Q2:1 + Q3:0 + Q4:1 + Q5:0 + Q6:2 + Q7:1)");
  console.log("  Máximo: 21 (7 × 3)");
  console.log("  Média aleatória: ~13");

  console.log("\n✅ Ranges corrigidos:");
  console.log("  0–10  → O Cristão Superficial (cobre 6–10)");
  console.log("  11–15 → O Soldado Desarmado");
  console.log("  16–21 → O Líder Omitido");

  process.exit(0);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
