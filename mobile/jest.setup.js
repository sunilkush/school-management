jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native-webview looks up its native module the moment it is imported, and a Jest run has
// no native binary — so every suite that reaches the registry (which reaches DetailScreen, which
// reaches the map) would fail to load. Nothing under test drives a map; a plain View stands in.
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { __esModule: true, WebView: View, default: View };
});
