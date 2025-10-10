module.exports = {
  preset: "jest-preset-angular",
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],

  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.(ts|js|mjs|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.html$",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/../src/$1",
    "^@fullcalendar/angular$":
      "<rootDir>/src/__mocks__/@fullcalendar/angular.js",
    "^@fullcalendar/(.*)$": "<rootDir>/node_modules/@fullcalendar/$1",
  },
  moduleFileExtensions: ["ts", "html", "js", "json", "mjs"],
  testEnvironment: "jsdom",

  transformIgnorePatterns: [
    "node_modules/(?!(@angular|rxjs|zone\\.js|@fullcalendar|preact)/)",
    "/dist/",
    "/out/",
  ],
  coveragePathIgnorePatterns: [
    "karma.conf.js",
    "jest.config.js",
    "commitlint.config.js",
    ".angular/cache/20.3.4/davi-fbol-cultivarte-front-mngr/vite",
    "coverage/",
    "test.ts",
    "environments",
    "src/app/app.config.ts",
    "src/app/app.routes.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.route.ts",
    "!**/*.d.(t|j)s",
    "!**/main.(t|j)s",
    "!**/index.(t|j)s",
    "!**/logger.(t|j)s",
    "!**/*.middleware.ts",
    "!**/configuration.(t|j)s",
  ],

  coverageDirectory: "../coverage",

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/../src/$1",
  },
};
