// Jest config dedicated to the Firestore rules unit tests.
//
// Separate from the main jest.config.js (Phase 3) because these
// tests talk to a local Firestore emulator and use the node
// environment, while the main suite is for pure RN/TS unit tests
// that don't need the emulator. Keeping them split means the main
// test suite stays fast and doesn't require firebase-tools to be
// installed on every dev machine.
//
// Run via: `bun run test:rules`
//   which does: `firebase emulators:exec --only firestore
//                jest --config jest.rules.config.js --runInBand`

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/firestore-rules.test.ts"],
  testTimeout: 15000,
  // Rules tests are stateful against the emulator and flaky if
  // parallelized — run serially.
  maxWorkers: 1,
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
        },
      },
    ],
  },
};
