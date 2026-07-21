import "server-only";
import { createHash, randomUUID } from "crypto";
import { resourceTypeFor } from "@/lib/domain/portal";
import type { SignedUpload, StorageProvider } from "./provider";

/**
 * Cloudinary storage provider.
 *
 * Uses signed direct uploads: the server signs {folder, public_id,
 * timestamp} with the API secret; the browser uploads straight to
 * Cloudinary with that signature. The API secret never leaves the server.
 */

function cfg() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    folder: process.env.CLOUDINARY_FOLDER ?? "911-makers-ccc",
  };
}

/** Cloudinary signature: sha1 of "k1=v1&k2=v2...<api_secret>" (keys sorted). */
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export const cloudinaryProvider: StorageProvider = {
  name: "cloudinary",

  isConfigured() {
    const c = cfg();
    return Boolean(c.cloudName && c.apiKey && c.apiSecret);
  },

  signUpload({ projectId, category, filename, mimeType }): SignedUpload {
    const c = cfg();
    if (!this.isConfigured()) {
      throw new Error(
        "File storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the environment."
      );
    }
    const resourceType = resourceTypeFor(mimeType);
    const safeCategory = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const folder = `${c.folder}/${projectId}/${safeCategory}`;
    const publicId = randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));

    const toSign: Record<string, string> = { folder, public_id: publicId, timestamp };
    const signature = sign(toSign, c.apiSecret);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType}/upload`,
      fields: {
        api_key: c.apiKey,
        timestamp,
        signature,
        folder,
        public_id: publicId,
      },
      publicId: `${folder}/${publicId}`,
      resourceType,
    };
  },

  async deleteFile(publicId: string, resourceType: string): Promise<void> {
    const c = cfg();
    if (!this.isConfigured()) return;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = { public_id: publicId, timestamp };
    const signature = sign(params, c.apiSecret);

    const body = new URLSearchParams({ ...params, api_key: c.apiKey, signature });
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType || "raw"}/destroy`,
      { method: "POST", body }
    );
    if (!res.ok) {
      throw new Error("The file could not be removed from storage. Please try again.");
    }
  },

  thumbnailUrl(secureUrl: string, resourceType: string): string {
    if (resourceType !== "image") return "";
    return secureUrl.replace("/upload/", "/upload/c_fill,w_240,h_240,q_auto/");
  },
};
