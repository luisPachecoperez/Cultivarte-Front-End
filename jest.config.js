module.exports = {
    preset: 'jest-preset-angular',
    rootDir: '.',
    setupFilesAfterEnv: ['<rootDir>/src/tests/test.ts'],
    
    testMatch: ['**/*.spec.ts'],
    transform: {
      '^.+\\.(ts|js|mjs|html)$': 'jest-preset-angular',
    },
    moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
    testEnvironment: 'jsdom',
    globals: {
      'ts-jest': {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    },
    transformIgnorePatterns: [
      'node_modules/(?!@angular|rxjs|zone\\.js)',
    ],
    coverageThreshold: {
            global: {
                branches: 90,
                functions: 90,
                lines: 90,
                statements: 90
            }
        },
        
        
        transform: {
            '^.+\\.(t|j)s$': 'ts-jest'
        },
        collectCoverageFrom: [
            '**/*.(t|j)s',
            '!**/*.route.ts',
            '!**/*.d.(t|j)s',
            '!**/main.(t|j)s',
            '!**/index.(t|j)s',
            '!**/logger.(t|j)s',
            '!**/*.middleware.ts',
            '!**/configuration.(t|j)s'
        ],
        
        coverageDirectory: '../coverage',
        
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/../src/$1',
        },

  };