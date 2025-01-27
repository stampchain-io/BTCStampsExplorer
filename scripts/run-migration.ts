import { dbManager } from "../server/database/databaseManager.ts";

async function runMigration() {
  try {
    const sql = await Deno.readTextFile(
      "./server/database/migrations/20240320_create_audio_files.sql",
    );
    await dbManager.executeQuery(sql, []);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await runMigration();
}
