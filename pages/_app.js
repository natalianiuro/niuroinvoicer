import "@/styles/globals.css";
import Layout from "@/components/layout/Layout";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";

export default function App({ Component, pageProps }) {
  if (Component.getLayout) {
    return (
      <StoreProvider>
        <ToastProvider>
          {Component.getLayout(<Component {...pageProps} />)}
        </ToastProvider>
      </StoreProvider>
    );
  }
  return (
    <StoreProvider>
      <ToastProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ToastProvider>
    </StoreProvider>
  );
}
