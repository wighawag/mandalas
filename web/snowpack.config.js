const {folder} = require('snowpack-plugin-folder2routes');
const {filterFiles} = require('snowpack-plugin-hmr-inject');
const {resolve} = require('path');

const mount = {
  public: {url: '/', static: true},
  src: {url: '/dist'},
};
mount[resolve(__dirname, '../common-lib')] = '/dist/mandalas-common';

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount,
  alias: {
    'mandalas-common': '../common-lib/src',
  },
  plugins: [
    '@snowpack/plugin-svelte',
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
    '@snowpack/plugin-postcss',
    [
      'snowpack-plugin-hmr-inject',
      {filter: filterFiles({includes: ['src/stores/*']})},
    ],
    'snowpack-plugin-window-modules',
    'snowpack-plugin-folder2routes',
    [
      'snowpack-plugin-ipfs',
      {
        serviceWorker: 'sw.js',
        routes: () => folder.routes,
        ethLinkErrorRedirect: {
          redirectTo: 'ipns',
          nodeURL:
            'https://mainnet.infura.io/v3/bc0bdd4eaac640278cdebc3aa91fabe4',
        },
        injectDebugConsole: true,
      },
    ],
  ],
  routes: [{match: 'routes', src: '.*', dest: '/index.html'}],
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2020',
    splitting: true,
    treeshake: true,
    manifest: true, // required by snowpack-plugin-ipfs
  },
  buildOptions: {
    sourcemap: true,
  },
};
