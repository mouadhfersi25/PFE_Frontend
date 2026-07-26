/**
 * Convertit une data URL image en File pour un upload multipart,
 * afin d'éviter d'envoyer des méga-octets de base64 dans le JSON.
 */
export async function dataUrlToImageFile(dataUrl: string, baseName = 'cover'): Promise<File | null> {
  if (!dataUrl.startsWith('data:image/')) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpeg';
    return new File([blob], `${baseName}.${ext}`, { type });
  } catch {
    return null;
  }
}
