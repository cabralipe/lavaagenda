/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel serverless entrypoint for the LavaAgenda API.
 * All route logic lives in src/app.ts (shared with the dev server).
 */

import { createApp } from '../src/api_app';

export default createApp();
