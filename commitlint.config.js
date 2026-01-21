
const customRulesPlugin = {
  rules: {
    'custom-scope': ({ scope }) => {
      if (!scope) return [false, 'scope is required'];

      const project = process.env.PROJECT_JIRA;
      const [firstPart, secondPart] = scope.split(' - ');
      const regexFirstPart = new RegExp(`^\\(${project}-\\d+\\)$`);
      const regexSecondPart = new RegExp(`^HU\\(${project}-\\d+\\)$`);

      if (!regexFirstPart.test(firstPart)) {
        return [
          false,
          `first part of scope '${firstPart}' does not match '(${project}-<number>)' pattern`,
        ];
      }

      if (!secondPart || !regexSecondPart.test(secondPart)) {
        return [
          false,
          `second part of scope '${secondPart}' does not match 'HU(${project}-<number>)' pattern`,
        ];
      }

      return [true];
    },
  },
};

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [customRulesPlugin],
  rules: {
    'custom-scope': [2, 'always'],
  },
};
