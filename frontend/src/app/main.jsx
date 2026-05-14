import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { twMerge } from "tailwind-merge";
import { RouterProvider } from "react-router-dom";
import "antd/dist/reset.css";
import "../index.css";

import { ThemeProvider } from "../context/ThemeContext.jsx";
import router from "./router.jsx";
import store, { persistor } from "./store/store.js";
import ThemedAntWrapper from "./providers/ThemedAntWrapper.jsx";

const Loader = lazy(() => import("../components/Loader/Loader.jsx"));

const mountNode = document.getElementById("root");

if (!mountNode) {
  throw new Error('Root container "#root" was not found.');
}

const ROOT_INSTANCE_KEY = "__school_management_react_root__";
const root = mountNode[ROOT_INSTANCE_KEY] ?? createRoot(mountNode);
mountNode[ROOT_INSTANCE_KEY] = root;

const renderApp = () => {
  root.render(
    <Provider store={store}>
      <PersistGate loading={<Loader />} persistor={persistor}>
        <ThemeProvider>
          <ThemedAntWrapper>
            <PrimeReactProvider
              value={{
                unstyled: true,
                pt: Tailwind,
                ptOptions: {
                  mergeSections: true,
                  mergeProps: true,
                  classNameMergeFunction: twMerge,
                },
              }}
            >
              <Suspense fallback={<Loader />}>
                <RouterProvider router={router} />
              </Suspense>
            </PrimeReactProvider>
          </ThemedAntWrapper>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept(renderApp);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}
