export function getProductImageUrl(storagePath: string | null | undefined) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!base || !storagePath) {
    return null;
  }

  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/storage/v1/object/public/product-images/${encodedPath}`;
}
