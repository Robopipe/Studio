// Sub-path import: the package barrel also re-exports the Next.js config,
// whose `next/jest` require would crash in this app.
import { nestConfig } from '@repo/jest-config/nest';

export default {
  ...nestConfig,
  // Source files import via the tsconfig baseUrl ("src/..."); map those to
  // rootDir (which nestConfig sets to "src") so jest can resolve them.
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
