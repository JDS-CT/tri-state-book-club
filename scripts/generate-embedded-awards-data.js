#!/usr/bin/env node
const fs = require('node:fs/promises');
const path = require('node:path');

const loader = require('../Awards Webpage/js/awardsLoader.js');

async function readJson(relativePath) {
  const absolutePath = path.resolve(__dirname, '..', relativePath);
  const raw = await fs.readFile(absolutePath, 'utf-8');
  return JSON.parse(raw);
}

async function createFileFetch() {
  return async function fileFetch(resource) {
    const normalized = resource.startsWith('/') ? resource.slice(1) : resource;
    const absolutePath = path.resolve(__dirname, '..', normalized);
    const raw = await fs.readFile(absolutePath, 'utf-8');
    return {
      ok: true,
      async json() {
        return JSON.parse(raw);
      }
    };
  };
}

async function buildSnapshots(manifest, manifestBase) {
  const snapshots = {};
  const fetchImpl = await createFileFetch();

  for (const [year, entry] of Object.entries(manifest)) {
    const payload = await loader.loadAwardsData({
      year,
      basePath: manifestBase,
      fetchImpl
    });

    snapshots[year] = {
      base: manifestBase,
      path: entry.path,
      format: entry.format,
      title: entry.title,
      data: payload
    };
  }

  return snapshots;
}

async function main() {
  const manifestBase = 'years';
  const manifest = await readJson(path.join(manifestBase, 'canonical-nominations.json'));
  const snapshots = await buildSnapshots(manifest, manifestBase);

  const header = `// AUTO-GENERATED FILE. Run "node scripts/generate-embedded-awards-data.js" after updating canonical data.\n`;
  const factoryIntro = `"use strict";\n${header}(function (global, factory) {\n  if (typeof module === 'object' && module.exports) {\n    module.exports = factory();\n  } else {\n    global.AwardsEmbeddedData = factory();\n  }\n})(typeof self !== 'undefined' ? self : this, function () {\n  const manifestBase = '${manifestBase}';\n  const manifestByYear = ${JSON.stringify(snapshots, null, 2)};\n\n  function get(year) {\n    const key = String(year);\n    if (Object.prototype.hasOwnProperty.call(manifestByYear, key)) {\n      return manifestByYear[key];\n    }\n    const numeric = Number.parseInt(key, 10);\n    if (Number.isFinite(numeric) && Object.prototype.hasOwnProperty.call(manifestByYear, numeric)) {\n      return manifestByYear[numeric];\n    }\n    return null;\n  }\n\n  return {\n    manifestBase,\n    byYear: manifestByYear,\n    get\n  };\n});\n`;

  const outputPath = path.resolve(__dirname, '..', 'Awards Webpage/js/embeddedAwardsData.js');
  await fs.writeFile(outputPath, factoryIntro, 'utf-8');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
