import path, { resolve } from 'node:path';
import objectHash from 'object-hash';
import { f as fsCachePath, s as supportedImageTypes, g as getSrcPath, a as sharp } from '../entry.mjs';
import fs from 'node:fs';
import 'node:stream';
import { fileURLToPath } from 'node:url';
import 'node:crypto';
import 'magic-string';
import '@astrojs/netlify/netlify-functions.js';
import 'solid-js/web';
import 'html-escaper';
/* empty css                     *//* empty css                 */import 'node:util';
import 'potrace';
import 'find-up';
import 'find-cache-dir';
import 'mime';
import 'kleur/colors';
import 'string-width';
import 'path-browserify';
import 'path-to-regexp';

// @ts-check

async function getCachedBuffer(hash, image) {
  const cacheFilePath = fsCachePath + hash;

  if (fs.existsSync(cacheFilePath)) {
    return fs.promises.readFile(cacheFilePath);
  }

  const buffer = await image.clone().toBuffer();

  await fs.promises.writeFile(cacheFilePath, buffer);

  return buffer;
}

// @ts-check

function getConfigOptions(config, ext, imageWidth) {
  const { w, width = w, format = ext, base64, raw, inline, ...rest } = config;

  const imageFormat = format === "jpeg" ? "jpg" : format;

  const widths = width
    ? width.split(";").map((w) => parseInt(w))
    : [imageWidth];

  const extension = format === "jpg" ? "jpeg" : format;
  const type = `image/${extension}`;

  const options = {
    format: imageFormat,
    ...rest,
  };

  return {
    type,
    widths,
    options,
    extension,
    raw: typeof raw === "string",
    inline: typeof base64 === "string" || typeof inline === "string",
  };
}

function getAssetPath(base, assetFileNames, ext, width, hash) {
  const name = `${base}@${width}w`;

  const extname = `.${ext}`;

  const assetPath = assetFileNames
    .replace("asset.", name + ".")
    .replace("[name]", name)
    .replace("[hash]", hash.slice(0, 8))
    .replace("[ext]", ext)
    .replace("[extname]", extname);

  return assetPath;
}

// @ts-check

if (!globalThis.astroImageToolsStore)
  globalThis.astroImageToolsStore = new Map();

const store = globalThis.astroImageToolsStore;

const filename = fileURLToPath(import.meta.url);

resolve(filename, "../../astroViteConfigs.js");

// @ts-check

const { getLoadedImage, getTransformedImage } = await (sharp
  ? import('./imagetools.72f82cbc.mjs')
  : import('./codecs.e1182cc3.mjs'));

async function load(id) {
  try {
    var fileURL = new URL(`file://${id}`);
  } catch (error) {
    return null;
  }

  const { search, searchParams } = fileURL;

  id = id.replace(search, "");

  const ext = path.extname(id).slice(1);

  if (supportedImageTypes.includes(ext)) {
    const { default: astroViteConfigs } = await import(
      // @ts-ignore
      './astroViteConfigs.e6e35cf0.mjs'
    );

    const { environment, projectBase, assetFileNames } = astroViteConfigs;

    const src = await getSrcPath(id);

    const config = Object.fromEntries(searchParams);

    const base = path.basename(src, path.extname(src));

    const { image: loadedImage, width: imageWidth } =
      store.get(src) || store.set(src, await getLoadedImage(src, ext)).get(src);

    const { type, widths, options, extension, raw, inline } = getConfigOptions(
      config,
      ext,
      imageWidth
    );

    if (raw) {
      const testConfig = { ...config };

      delete testConfig.raw;
      delete testConfig.inline;
      delete testConfig.base64;

      if (Object.keys(testConfig).length > 0) {
        throw new Error(
          "If raw is set, no other options can be set except inline and base64"
        );
      }
    }

    if (inline) {
      if (widths.length > 1) {
        throw new Error(
          `The base64 or inline parameter can't be used with multiple widths`
        );
      }

      const [width] = widths;

      const hash = objectHash([src, width, options]);

      if (store.has(hash)) {
        return `export default "${store.get(hash)}"`;
      } else {
        const config = { width, ...options };

        const { image, buffer } = raw
          ? {
              image: sharp ? loadedImage : null,
              buffer: !sharp ? loadedImage.data : null,
            }
          : await getTransformedImage({
              src,
              image: loadedImage,
              config,
              type,
            });

        const dataUri = `data:${type};base64,${(
          buffer || (await getCachedBuffer(hash, image))
        ).toString("base64")}`;

        store.set(hash, dataUri);

        return `export default "${dataUri}"`;
      }
    } else {
      const sources = await Promise.all(
        widths.map(async (width) => {
          const hash = objectHash([src, width, options]);

          const assetPath = getAssetPath(
            base,
            assetFileNames,
            extension,
            width,
            hash
          );

          if (!store.has(assetPath)) {
            const config = { width, ...options };

            const { image, buffer } = raw
              ? {
                  image: sharp && loadedImage,
                  buffer: !sharp && loadedImage.data,
                }
              : await getTransformedImage({
                  src,
                  image: loadedImage,
                  config,
                  type,
                });

            const imageObject = { hash, type, image, buffer };

            store.set(assetPath, imageObject);
          }

          const modulePath =
            environment === "dev" ? assetPath : projectBase + assetPath;

          return { width, modulePath };
        })
      );

      const srcset =
        sources.length > 1
          ? sources
              .map(({ width, modulePath }) => `${modulePath} ${width}w`)
              .join(", ")
          : sources[0].modulePath;

      return `export default "${srcset}"`;
    }
  }
}

export { load as default };
