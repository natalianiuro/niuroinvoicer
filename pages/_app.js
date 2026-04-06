import "@/styles/globals.css";
import Layout from "@/components/layout/Layout";

export default function App({ Component, pageProps }) {
  // Allow pages to define their own layout (e.g. generator skips sidebar)
  if (Component.getLayout) {
    return Component.getLayout(<Component {...pageProps} />);
  }
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
