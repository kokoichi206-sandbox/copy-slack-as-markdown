import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageOnly = process.argv[2] === "--package-only";
const expectedTag = packageOnly ? undefined : process.argv[2];
const versionParts = packageJson.version.split(".");

const isChromeExtensionVersion =
  versionParts.length >= 1 &&
  versionParts.length <= 4 &&
  versionParts.every(
    (part) =>
      /^(0|[1-9]\d*)$/.test(part) &&
      Number(part) >= 0 &&
      Number(part) <= 65_535,
  ) &&
  versionParts.some((part) => Number(part) !== 0);

if (!isChromeExtensionVersion) {
  throw new Error(
    `package.json version must use Chrome's one-to-four-part integer format: ${packageJson.version}`,
  );
}

if (!packageOnly) {
  const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));

  if (manifest.version !== packageJson.version) {
    throw new Error(
      `Version mismatch: package.json=${packageJson.version} dist/manifest.json=${manifest.version}`,
    );
  }
}

if (expectedTag !== undefined && expectedTag !== `v${packageJson.version}`) {
  throw new Error(
    `Version mismatch: tag=${expectedTag} package.json=${packageJson.version}`,
  );
}

console.log(
  `Verified extension version ${packageJson.version}${expectedTag === undefined ? "" : ` for ${expectedTag}`}`,
);
