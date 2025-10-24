module.exports = {
  "testEnvironment": "node",
  "testTimeout": 10000,
  "setupFilesAfterEnv": [
    "<rootDir>/test/setupTests.js"
  ],
  "collectCoverageFrom": [
    "src/**/*.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "preset": "ts-jest"
};