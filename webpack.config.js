const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const frontendDirectory = 'nuance_assets'; // Set your frontend directory name
const isDevelopment = process.env.NODE_ENV !== 'production';

function initCanisterEnv() {
  let localCanisters, prodCanisters;
  try {
    localCanisters = require(path.resolve(
      '.dfx',
      'local',
      'canister_ids.json'
    ));
  } catch (error) {
    console.log('No local canister_ids.json found. Continuing production');
  }
  try {
    prodCanisters = require(path.resolve('canister_ids.json'));
  } catch (error) {
    console.log('No production canister_ids.json found. Continuing with local');
  }

  const network =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === 'production' ? 'ic' : 'local');

  const canisterConfig = network === 'local' ? localCanisters : prodCanisters;

  return Object.entries(canisterConfig).reduce((prev, current) => {
    const [canisterName, canisterDetails] = current;
    prev[canisterName.toUpperCase() + '_CANISTER_ID'] =
      canisterDetails[network];
    return prev;
  }, {});
}
const canisterEnvVariables = initCanisterEnv();

module.exports = {
  entry: path.join(__dirname, 'src', frontendDirectory, 'index.tsx'), // Set the entry point of your application
  output: {
    filename: 'bundle.js', // Name of the output bundle
    path: path.resolve(__dirname, 'dist'), // Output directory
    publicPath: '/', // Public URL of the output directory when referenced in a browser
  },
  mode: isDevelopment ? 'development' : 'production', // Set the mode to 'development' or 'production'
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // File extensions to resolve
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/, // Match .js, .jsx, .ts, and .tsx files
        exclude: /node_modules/, // Exclude files in node_modules directory
        use: 'ts-loader', // Use ts-loader to transpile TypeScript files
      },
      {
        test: /\.css$/, // Match .css files
        use: ['style-loader', 'css-loader'], // Use style-loader and css-loader for CSS files
      },
      // Add loaders for other file types as needed
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', frontendDirectory, 'index.html'), // Path to your HTML template
    }),
    new Dotenv({
      path: `./.env${isDevelopment ? '.local' : ''}`,
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      ...canisterEnvVariables,
    }),
  ],
  devServer: {
    proxy: [{
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api',
        },
      },
    }],
    static: {
      directory: path.join(__dirname, 'dist'), // Directory to serve static files from
    },
    compress: true, // Enable gzip compression for everything served
    port: 8081, // Port number for the dev server
    historyApiFallback: true, // Fallback to index.html for Single Page Applications
    hot: true
  },
};
