import { LocalStorageProvider } from './local.provider.js';

let instance = null;

export function getStorageProvider() {
  if (!instance) {
    // Future: switch based on config for S3, GCS, etc.
    instance = new LocalStorageProvider();
  }
  return instance;
}
