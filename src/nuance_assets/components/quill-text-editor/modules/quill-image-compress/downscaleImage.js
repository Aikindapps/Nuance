//https://github.com/benwinding/quill-image-compress

// Take an image URL, downscale it to the given width, and return a new image URL.
export async function downscaleImage(
  dataUrl,
  maxWidth,
  maxHeight,
  imageType,
  keepImageTypes,
  ignoreImageTypes,
  imageQuality,
  logger,
  exactWidth,
  exactHeight
) {
  'use strict';
  // Input image values
  const inputImageType = dataUrl.split(';')[0].split(':')[1];

  // Provide default values
  imageType = imageType || 'image/jpeg';
  imageQuality = imageQuality || 0.7;

  // Create a temporary image so that we can compute the height of the downscaled image.
  const image = new Image();
  image.src = dataUrl;
  await new Promise((resolve) => {
    image.onload = () => {
      resolve();
    };
  });
  const [newWidth, newHeight] = getDimensions(
    image.width,
    image.height,
    maxWidth,
    maxHeight,
    exactWidth,
    exactHeight
  );

  // Create a temporary canvas to draw the downscaled image on.
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');

  // If the type is an jpeg, draw a white background first.
  if (imageType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, image.width, image.height);
  }

  // If the type is included in the ignore list, return the original
  if (ignoreImageTypes.includes(inputImageType)) {
    return dataUrl;
  }

  // If the type is included in keep type list, fix the image type
  if (keepImageTypes.includes(inputImageType)) {
    imageType = inputImageType;
  }

  // Draw the downscaled image on the canvas and return the new data URL.
  ctx.drawImage(image, 0, 0, newWidth, newHeight);
  const newDataUrl = canvas.toDataURL(imageType, imageQuality);
  logger.log('downscaling image...', {
    args: {
      dataUrl,
      maxWidth,
      maxHeight,
      imageType,
      ignoreImageTypes,
      keepImageTypes,
      imageQuality,
    },
    newHeight,
    newWidth,
  });
  return newDataUrl;
}

function getDimensions(inputWidth, inputHeight, maxWidth, maxHeight,exactWidth, exactHeight) {
  if(exactWidth && exactHeight){
    return [exactWidth, exactHeight]
  }
  if (inputWidth <= maxWidth && inputHeight <= maxHeight) {
    return [inputWidth, inputHeight];
  }
  if (inputWidth > maxWidth) {
    const newWidth = maxWidth;
    const newHeight = Math.floor((inputHeight / inputWidth) * newWidth);

    if (newHeight > maxHeight) {
      const newHeight = maxHeight;
      const newWidth = Math.floor((inputWidth / inputHeight) * newHeight);
      return [newWidth, newHeight];
    } else {
      return [newWidth, newHeight];
    }
  }
  if (inputHeight > maxHeight) {
    const newHeight = maxHeight;
    const newWidth = Math.floor((inputWidth / inputHeight) * newHeight);
    return [newWidth, newHeight];
  }
}
