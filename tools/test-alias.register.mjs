// Entry passed to `node --import` so the alias resolve hook is registered before tests run.
import { register } from 'node:module'

register('./test-alias.hooks.mjs', import.meta.url)
