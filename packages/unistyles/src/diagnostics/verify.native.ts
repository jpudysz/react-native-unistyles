import type { VerifyReport } from './types'

import { UnistylesShadowRegistry } from '../specs'

// Compares props committed to the shadow tree with styles rebuilt for every linked node
// (its own arguments, variants and the current theme). Meant for tests, it never commits anything.
export const verify = (): VerifyReport => UnistylesShadowRegistry.verify()
