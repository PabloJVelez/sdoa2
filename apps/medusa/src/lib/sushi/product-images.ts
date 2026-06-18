/** Map ordered image URLs to Medusa product image inputs. */
export function toProductImageInputs(urls: string[]) {
  return urls.map((url, rank) => ({ url, rank }))
}

export function resolveProductThumbnail(
  thumbnail: string | null | undefined,
  imageUrls: string[],
): string | undefined {
  if (thumbnail) return thumbnail
  return imageUrls[0]
}
