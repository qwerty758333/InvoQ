import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

/**
 * Upload an invoice image to Vercel Blob storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadInvoiceImage(
  file: File,
  userId: string
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN environment variable is not configured"
    );
  }
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `invoices/${userId}/${randomUUID()}.${ext}`;
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
