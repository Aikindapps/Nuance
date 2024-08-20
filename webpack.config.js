const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');
var DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");

function initCanisterEnv() {
  let localCanisters, prodCanisters;
  try {
    localCanisters = require(path.resolve('.dfx', 'local', 'canister_ids.json'));
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

const isDevelopment = process.env.NODE_ENV !== 'production';

const frontendDirectory = 'nuance_assets';

module.exports = {
  target: 'web',
  devtool: isDevelopment
    ? 'eval' /* eval for fastest dev build or eval-source-map for slower build */
    : 'source-map' /* recommended choice for production builds with high quality SourceMaps. */,
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    index: path.join(__dirname, 'src', frontendDirectory, 'index.tsx'),
  },
  optimization: {
    minimize: !isDevelopment,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          safari10: true,
        },
      }),
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      events: require.resolve('events/'),
      stream: require.resolve('stream-browserify/'),
      util: require.resolve('util/'),
    },
  },
  output: {
    filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
    path: path.join(__dirname, `dist`),
    publicPath: '/',
  },

  module: {
    rules: [
      { test: /\.(js|ts)x?$/i, loader: 'ts-loader' },
      {
        test: /\.(css|s[ac]ss)$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { sourceMap: true },
          },
          {
            loader: 'resolve-url-loader',
            options: { sourceMap: true },
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: true },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|eot|ttf|woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    new Dotenv({
      path: `./.env${isDevelopment ? '.local' : ''}`,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', frontendDirectory, 'index.html'),
      cache: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'src', frontendDirectory, 'assets'),
          to: path.join(__dirname, 'dist'),
        },
      ],
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      ...canisterEnvVariables,
    }),
    new webpack.ProvidePlugin({
      Buffer: [require.resolve('buffer/'), 'Buffer'],
      process: require.resolve('process/browser'),
    }),
  ],
  devServer: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "/api",
        },
      },
    },
    hot: true,
    watchFiles: [path.resolve(__dirname, 'src', frontendDirectory)],
    liveReload: true,
    historyApiFallback: true,
  },
};
