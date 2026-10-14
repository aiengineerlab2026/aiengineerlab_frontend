/**
 * Pictures pasted or dropped into an article are stored inside it, so each one is shrunk to a reasonable size first.
 * Big photos and screenshots are always accepted: they are scaled and compressed step by step until they fit.
 */
const START_SIDE = 1600; // longest side to start from, in pixels
const MIN_SIDE = 400; // never shrink below this
const TARGET_BYTES = 1_200_000; // wanted size of one stored picture
const MAX_GIF_BYTES = 4_000_000; // GIFs cannot be re-encoded without losing the animation

const read = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(blob);
  });

const load = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This image cannot be read."));
    img.src = url;
  });

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

function draw(img: HTMLImageElement, side: number, background?: string): HTMLCanvasElement {
  const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process images.");
  if (background) {
    ctx.fillStyle = background; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * A data URI for the image. Small images are kept as they are; larger ones are scaled down and re-encoded, trying
 * lossless PNG first for PNG sources (crisp screenshots, transparency), then JPEG, each time at a smaller size
 * until the result is about 1.2 MB or less.
 */
export async function imageToDataUrl(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) throw new Error("Only PNG, JPEG, GIF and WebP images can be added.");
  const original = await read(file);
  if (file.type === "image/gif") {
    if (file.size > MAX_GIF_BYTES) throw new Error("This GIF is too large (limit 4 MB). Try a still image or a shorter GIF.");
    return original; // a canvas would flatten the animation
  }

  const img = await load(original);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= START_SIDE && file.size <= TARGET_BYTES) return original;

  let side = Math.min(START_SIDE, longest);
  let smallest: Blob | null = null;
  for (;;) {
    if (file.type === "image/png") {
      const png = await toBlob(draw(img, side), "image/png");
      if (png && png.size <= TARGET_BYTES) return read(png);
    }
    const flat = draw(img, side, "#fff");
    for (const quality of [0.85, 0.7, 0.55]) {
      const jpeg = await toBlob(flat, "image/jpeg", quality);
      if (jpeg && (!smallest || jpeg.size < smallest.size)) smallest = jpeg;
      if (jpeg && jpeg.size <= TARGET_BYTES) return read(jpeg);
    }
    if (side <= MIN_SIDE) break;
    side = Math.max(MIN_SIDE, Math.round(side * 0.8));
  }
  if (!smallest) throw new Error("Could not process this image.");
  return read(smallest);
}

export const imageFiles = (files: FileList | File[] | null | undefined) =>
  [...(files ?? [])].filter((f) => f.type.startsWith("image/"));
