/**
 * Storage Service abstraction.
 *
 * Files are uploaded directly from the browser to the storage provider
 * using short-lived signed parameters minted by the server — credentials
 * never reach the client, and large files never pass through our API.
 *
 * Swapping providers (Firebase Storage, S3, Azure Blob, GCS) means
 * implementing this interface; UI and business logic stay unchanged.
 */

export interface SignedUpload {
  /** Where the browser POSTs the file. */
  uploadUrl: string;
  /** Form fields to include with the file. */
  fields: Record<string, string>;
  /** Provider-side id the file will be stored under. */
  publicId: string;
  resourceType: string;
}

export interface StorageProvider {
  readonly name: string;
  /** True when the provider has credentials configured. */
  isConfigured(): boolean;
  /** Mints signed parameters for one direct browser upload. */
  signUpload(opts: {
    projectId: string;
    category: string;
    filename: string;
    mimeType: string;
  }): SignedUpload;
  /** Permanently deletes a stored file. */
  deleteFile(publicId: string, resourceType: string): Promise<void>;
  /** Small preview URL for an image resource (empty string if n/a). */
  thumbnailUrl(secureUrl: string, resourceType: string): string;
}
