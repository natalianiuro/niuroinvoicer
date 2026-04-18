import "@/styles/globals.css";
import Layout from "@/components/layout/Layout";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";

const MAINTENANCE = false;

function MaintenancePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9f9f8", fontFamily: "system-ui, sans-serif" }}>
      <img src="/logo.png" alt="Niuro" style={{ width: 48, marginBottom: 24, opacity: 0.8 }} />
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px" }}>Under maintenance</h1>
      <p style={{ fontSize: 14, color: "#888", margin: 0 }}>We&apos;ll be back shortly.</p>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  if (MAINTENANCE) return <MaintenancePage />;

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
