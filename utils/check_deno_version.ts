const requiredVersion = "2.1.3";
const currentVersion = Deno.version.deno;

if (currentVersion !== requiredVersion) {
  console.error(
    `Your Deno version is ${currentVersion}, but version ${requiredVersion} is required.`,
  );
  console.error(
    `Please run \`deno upgrade --version ${requiredVersion}\` to update.`,
  );
  Deno.exit(1);
}
