# Stargazer Extension (Ledger)

This is an unofficial release of Stargazer Wallet with Tessellation v2 support for the unofficial Constellation Ledger app.

## Getting Started

## Option 1: Install

### Install Chrome Extension

- Download the latest release [here](https://github.com/buzzgreyday/stargazer-wallet-ledger/releases/latest)
- Extract the `zip` somewhere nice
- Open Chrome, click `extensions` and `enable developer mode`
- Locate the nice place and open the unzipped directory, then import

### Build and Load the Constellatio Ledger App

Since the app (v1.0.7) isn't officially supported, we'll have to build it:

## Option 2: Build

Ensure you have

- [Node.js](https://nodejs.org) 10 or later installed
- [Yarn](https://yarnpkg.com) v1 or v2 installed

Then run the following:

- `yarn install` to install dependencies.
- `yarn run dev:chrome` to start the development server for chrome extension
- `yarn run dev:firefox` to start the development server for firefox addon
- `yarn run dev:opera` to start the development server for opera extension
- `yarn run build:chrome` to build chrome extension
- `yarn run build:firefox` to build firefox addon
- `yarn run build:opera` to build opera extension
- `yarn run build` builds and packs extensions all at once to extension/ directory

### Development

- `yarn install` to install dependencies.
- To watch file changes in development

  - Chrome
    - `yarn run dev:chrome`
  - Firefox
    - `yarn run dev:firefox`
  - Opera
    - `yarn run dev:opera`

- **Load extension in browser**

- ### Chrome

  - Go to the browser address bar and type `chrome://extensions`
  - Check the `Developer Mode` button to enable it.
  - Click on the `Load Unpacked Extension…` button.
  - Select your extension’s extracted directory.

- ### Firefox

  - Load the Add-on via `about:debugging` as temporary Add-on.
  - Choose the `manifest.json` file in the extracted directory

- ### Opera

  - Load the extension via `opera:extensions`
  - Check the `Developer Mode` and load as unpacked from extension’s extracted directory.

### Production

- `yarn run build` builds the extension for all the browsers to `extension/BROWSER` directory respectively.

Note: By default the `manifest.json` is set with version `0.0.0`. The webpack loader will update the version in the build with that of the `package.json` version. In order to release a new version, update version in `package.json` and run script.

### Running E2E Test

The chrome e2e test can be ran with `yarn test:e2e:chrome`. But are only compatible if you have 
Chrome v79 installed. Update the chrome driver page to match your chrome install to run the e2e test
on a newer version of Chrome.

