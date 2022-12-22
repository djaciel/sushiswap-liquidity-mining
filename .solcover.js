module.exports = {
  norpc: true,
  testCommand: 'yarn test',
  compileCommand: 'yarn compile',
  skipFiles: ['test', 'interfaces'],
  mocha: {
    fgrep: '[skip-on-coverage]',
    invert: true,
  },
};
