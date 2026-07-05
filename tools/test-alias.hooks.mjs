// Minimal Node loader hook so `node --test` can resolve the project's `@/` alias
// (which maps to `src/`) the same way Vite does, including extension-less imports.
import { existsSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const srcDir = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', 'src')

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    let target = resolvePath(srcDir, specifier.slice(2))
    if (!existsSync(target) && existsSync(`${target}.js`)) {
      target = `${target}.js`
    }
    return nextResolve(pathToFileURL(target).href, context)
  }
  return nextResolve(specifier, context)
}
