import "server-only";
import type { StorageProvider } from "./provider";
import { cloudinaryProvider } from "./cloudinary";

export type { SignedUpload, StorageProvider } from "./provider";

/**
 * Provider selection. Current provider: Cloudinary.
 * Future providers (Firebase Storage, S3, Azure Blob, GCS) register here;
 * UI and business logic never reference a provider directly.
 */
const provider = (process.env.STORAGE_PROVIDER ?? "cloudinary").toLowerCase();

export function getStorageProvider(): StorageProvider {
  switch (provider) {
    case "cloudinary":
    default:
      return cloudinaryProvider;
  }
}
