import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier === 'next/server') {
      try {
        return await nextResolve('next/server.js', context);
      } catch {}
    }
    if (err.code === 'ERR_MODULE_NOT_FOUND' && (specifier.startsWith('.') || specifier.startsWith('/'))) {
      const extensions = ['.ts', '.js', '.mjs', '/index.ts', '/index.js'];
      for (const ext of extensions) {
        try {
          return await nextResolve(specifier + ext, context);
        } catch {}
      }
    }
    throw err;
  }
}
