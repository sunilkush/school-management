import { ConfigProvider, App as AntdApp, theme as antdTheme } from "antd";

import { useTheme } from "../../context/ThemeContext.jsx";

const ThemedAntWrapper = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          borderRadius: 10,
          colorPrimary: "#1d5fd3",
          fontFamily: '"Noto Sans", sans-serif',
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
};

export default ThemedAntWrapper;
