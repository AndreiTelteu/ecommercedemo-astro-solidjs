import { loadImage, generateTransforms, builtins, applyTransforms } from 'imagetools-core';

// @ts-check

const getLoadedImage = async (src) => {
  const image = loadImage(src);

  const { width } = await image.metadata();

  return { image, width };
};

const getTransformedImage = async ({ image, config }) => {
  const { transforms } = generateTransforms(config, builtins);

  const { image: encodedImage } = await applyTransforms(
    transforms,
    image.clone()
  );

  return { image: encodedImage, buffer: null };
};

export { getLoadedImage, getTransformedImage };
