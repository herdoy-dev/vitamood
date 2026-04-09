// Main jest config for VitaMood unit tests.
//
// Runs pure TS/JS tests that don't touch the Firestore emulator —
// things like the safety keyword scanner, the prompt snapshot, and
// future pure-function helpers. The rules tests live in their own
// config (jest.rules.config.js) because they need the emulator and
// serial execution.
//
// Run via: `bun run test`

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/__tests__/safety-contract.test.ts",
    "<rootDir>/__tests__/prompt-snapshot.test.ts",
  ],
  testTimeout: 5000,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          target: "es2022",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
