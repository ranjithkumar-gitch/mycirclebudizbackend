import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.resolve('uploads');

export class LocalStorageProvider {
  async upload(fileBuffer, originalName, mimetype) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(originalName) || this.#mimeToExt(mimetype);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, fileBuffer);
    return `/uploads/${filename}`;
  }

  async delete(filePath) {
    const fullPath = path.resolve(filePath.replace(/^\//, ''));
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may not exist, ignore
    }
  }

  #mimeToExt(mimetype) {
    const map = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mimetype] || '.bin';
  }
}
