import "@/styles/globals.css";
import Layout from "@/components/layout/Layout";
import { StoreProvider } from "@/lib/store";

export default function App({ Component, pageProps }) {
  if (Component.getLayout) {
    return (
      <StoreProvider>
        {Component.getLayout(<Component {...pageProps} />)}
      </StoreProvider>
    );
  }
  return (
    <StoreProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </StoreProvider>
  );
}
