async function cleanup() {
  try {
    // Find and kill Deno debug processes
    const cmd = new Deno.Command("bash", {
      args: [
        "-c",
        "pkill -f 'deno.*--inspect' || true && lsof -ti:9229,8000 | xargs kill -9 2>/dev/null || true",
      ],
    });
    await cmd.output();

    // Wait for ports to be fully released
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✓ Ports cleaned up");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

if (import.meta.main) {
  await cleanup();
}
