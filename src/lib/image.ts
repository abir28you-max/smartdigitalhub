interface ImageOptions {
  width?: number;
  quality?: number;
}

// Serve Supabase Storage images through the on-the-fly image transformer so
// we ship correctly sized / compressed images instead of the originals.
export const getOptimizedImageUrl = (
  url: string | null | undefined,
  options?: ImageOptions
) => {
  if (!url) return "";
  if (!options?.width) return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  if (/\.svg($|\?)/i.test(url)) return url;

  // Cap DPR at 1.5 and total width at 1200px — beyond that the extra bytes
  // cost far more than the perceived sharpness on mobile screens.
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
  const width = Math.min(Math.round(options.width * dpr), 1200);
  const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${width}&quality=${options.quality ?? 70}&resize=contain`;
};
