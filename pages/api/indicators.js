// Fetches live UF and USD (CLP) values from mindicador.cl
// Called client-side from the dashboard; cached for 1 hour via Cache-Control

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  try {
    const [ufRes, usdRes] = await Promise.all([
      fetch("https://mindicador.cl/api/uf"),
      fetch("https://mindicador.cl/api/dolar"),
    ]);

    if (!ufRes.ok || !usdRes.ok) {
      throw new Error("mindicador.cl error");
    }

    const ufData = await ufRes.json();
    const usdData = await usdRes.json();

    const uf = ufData.serie?.[0]?.valor ?? null;
    const usd = usdData.serie?.[0]?.valor ?? null;
    const date = ufData.serie?.[0]?.fecha ?? null;

    res.status(200).json({ uf, usd, date });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch indicators", uf: null, usd: null });
  }
}
