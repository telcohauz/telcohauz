import { execFileSync } from "node:child_process";

// Inspect names only; never print environment file contents.
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0");
const unsafe = files.filter((file) => {
  const name = file.split("/").at(-1);
  return (name === ".env" || name?.startsWith(".env.")) && name !== ".env.example";
});
if (unsafe.length) {
  console.error("Tracked environment files must be removed from the index:", unsafe.join(", "));
  process.exitCode = 1;
} else {
  console.log("PASS: no tracked runtime environment files.");
}
