const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');
// Removed DuplicatePackageCheckerPlugin for better performance

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

  const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === 'production' ? 'ic' : 'local');
  const canisterConfig = network === 'local' ? localCanisters : prodCanisters;

  return Object.entries(canisterConfig).reduce((prev, current) => {
    const [canisterName, canisterDetails] = current;
    prev[canisterName.toUpperCase() + '_CANISTER_ID'] = canisterDetails[network];
    return prev;
  }, {});
}
const canisterEnvVariables = initCanisterEnv();

const isDevelopment = process.env.NODE_ENV !== 'production';
const frontendDirectory = 'nuance_assets';

module.exports = {
  target: 'web',
  devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map', // Updated devtool for better balance
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
            options: { sourceMap: isDevelopment }, // Enable source maps only in development
          },
          {
            loader: 'resolve-url-loader',
            options: { sourceMap: isDevelopment }, // Enable source maps only in development
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: isDevelopment }, // Enable source maps only in development
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
    // Removed the redundant TerserPlugin instance
    new webpack.optimize.AggressiveMergingPlugin(), // Optional: Test this to see if it improves performance
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
      NODE_ENV: isDevelopment ? 'development' : 'production',
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
    hot: true, // Only use hot reload
    // Limited watching to just the frontend directory to avoid unnecessary rebuilds
    watchFiles: [path.resolve(__dirname, 'src', frontendDirectory)],
    liveReload: false, // Disable liveReload to prevent conflicts with hot
    historyApiFallback: true,
  },
};
