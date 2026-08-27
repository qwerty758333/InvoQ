import { put } from "@vercel/blob";

/**
 * Upload an invoice image to Vercel Blob storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadInvoiceImage(
  file: File,
  userId: string
): Promise<string> {
  const filename = `invoices/${userId}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: "public",
  });
  return blob.url;
}

/**
 * Convert a File to a base64 string for AI processing.
 */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
