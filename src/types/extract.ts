import type { paths } from './api';

/** The JSON request body for a given path + method. */
export type Body<P extends keyof paths, M extends keyof paths[P]> =
  paths[P][M] extends { requestBody: { content: { 'application/json': infer B } } } ? B : never;