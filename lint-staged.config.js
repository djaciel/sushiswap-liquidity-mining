module.exports = {
  // Lint then format TypeScript and JavaScript files
  '**/*.(ts|js|rs)': (filenames) => [`yarn prettier --write ${filenames.join(' ')}`, `yarn eslint --fix ${filenames.join(' ')}`],

  // Format MarkDown and JSON
  '**/*.(md|json)': (filenames) => `yarn prettier --write ${filenames.join(' ')}`,

  // Format Solidity
  '**/*.(sol)': (filenames) => `yarn solhint --fix ${filenames.join(' ')}`,
};
