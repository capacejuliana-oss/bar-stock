import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

const PALETTE = ["#c9a84c","#e07b39","#4ca8c9","#9b4dca","#5cb85c","#e05c8a","#4cc9a8","#e0c44c","#7a9bca","#ca7a4c"];

const useIsMobile = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w < 640;
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [catColors, setCatColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("stock");
  const [categoriaAttiva, setCategoriaAttiva] = useState("Tutte");
  const [ricerca, setRicerca] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nome: "", categoria: "", unita: "Bottiglie", stock: "", minimo: "" });
  const [soloAlerte, setSoloAlerte] = useState(false);
  const [mostraExport, setMostraExport] = useState(false);
  const [nuovaCat, setNuovaCat] = useState("");
  const [barName, setBarName] = useState("Stock del Bar");
  const [editBarName, setEditBarName] = useState(false);
  const isMobile = useIsMobile();

  const loadData = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("id"),
      supabase.from("categories").select("*").order("id"),
    ]);
    if (prods) setProducts(prods);
    if (cats) {
      setCategorie(cats.map(c => c.nome));
      setCatColors(Object.fromEntries(cats.map(c => [c.nome, c.colore])));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("stock-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, loadData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const alerte = useMemo(() => products.filter(p => p.stock <= p.minimo), [products]);
  const filtrati = useMemo(() => products.filter(p => {
    const matchCat = categoriaAttiva === "Tutte" || p.categoria === categoriaAttiva;
    const matchRic = p.nome.toLowerCase().includes(ricerca.toLowerCase());
    const matchAllerta = !soloAlerte || p.stock <= p.minimo;
    return matchCat && matchRic && matchAllerta;
  }), [products, categoriaAttiva, ricerca, soloAlerte]);

  const apriAggiungi = () => { setForm({ nome: "", categoria: categorie[0] || "", unita: "Bottiglie", stock: "", minimo: "" }); setModal({ type: "add" }); };
  const apriModifica = (p) => { setForm({ nome: p.nome, categoria: p.categoria, unita: p.unita, stock: p.stock, minimo: p.minimo }); setModal({ type: "edit", product: p }); };

  const salva = async () => {
    if (!form.nome || form.stock === "" || form.minimo === "") return;
    const data = { nome: form.nome, categoria: form.categoria, unita: form.unita, stock: Number(form.stock), minimo: Number(form.minimo) };
    if (modal.type === "add") await supabase.from("products").insert([data]);
    else await supabase.from("products").update(data).eq("id", modal.product.id);
    setModal(null);
  };

  const elimina = async (id) => { await supabase.from("products").delete().eq("id", id); setModal(null); };

  const aggiungiCategoria = async () => {
    const nome = nuovaCat.trim();
    if (!nome || categorie.includes(nome)) return;
    const colore = PALETTE[categorie.length % PALETTE.length];
    await supabase.from("categories").insert([{ nome, colore }]);
    setNuovaCat("");
  };

  const eliminaCategoria = async (cat) => {
    await supabase.from("categories").delete().eq("nome", cat);
    await supabase.from("products").update({ categoria: "(senza categoria)" }).eq("categoria", cat);
  };

  const aggiornaCatColore = async (cat, colore) => {
    setCatColors(prev => ({ ...prev, [cat]: colore }));
    await supabase.from("categories").update({ colore }).eq("nome", cat);
  };

  const getStockColor = (p) => p.stock === 0 ? "#ff4444" : p.stock <= p.minimo ? "#ff9900" : "#00c875";
  const getStockLabel = (p) => p.stock === 0 ? "ESAURITO" : p.stock <= p.minimo ? "BASSO" : "OK";

  const inputStyle = { width: "100%", background: "#0d0d0f", border: "1px solid #2e2618", color: "#e8e0d0", padding: "11px 12px", borderRadius: "8px", fontSize: "16px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "11px", color: "#7a6a4a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" };
  const btnPrimary = { background: "#c9a84c", border: "none", color: "#0d0d0f", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", fontWeight: "bold" };
  const btnGhost = { background: "transparent", border: "1px solid #2e2618", color: "#7a6a4a", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#c9a84c", fontSize: "18px" }}>
      🍸 Caricamento...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", fontFamily: "'Georgia','Times New Roman',serif", color: "#e8e0d0" }}>
      <div style={{ background: "linear-gradient(135deg,#1a1208 0%,#0d0d0f 60%)", borderBottom: "1px solid #3a2e1a", padding: isMobile ? "16px 16px 12px" : "22px 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: isMobile ? "20px" : "26px" }}>🍸</span>
            {editBarName ? (
              <input autoFocus value={barName} onChange={e => setBarName(e.target.value)} onBlur={() => setEditBarName(false)} onKeyDown={e => e.key === "Enter" && setEditBarName(false)}
                style={{ ...inputStyle, width: "180px", padding: "4px 8px", fontSize: "20px", background: "transparent", border: "none", borderBottom: "1px solid #c9a84c", borderRadius: 0 }} />
            ) : (
              <h1 onClick={() => setEditBarName(true)} style={{ margin: 0, fontSize: isMobile ? "18px" : "24px", fontWeight: "normal", color: "#f5ead5", cursor: "pointer" }}>
                {barName} <span style={{ fontSize: "12px", color: "#3a2e1a" }}>✏️</span>
              </h1>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {alerte.length > 0 && (
              <button onClick={() => { setSoloAlerte(v => !v); setVista("stock"); }} style={{ background: soloAlerte ? "#ff9900" : "rgba(255,153,0,0.15)", border: "1px solid #ff9900", color: soloAlerte ? "#000" : "#ff9900", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: "bold" }}>
                ⚠ {alerte.length}
              </button>
            )}
            <button onClick={() => setMostraExport(true)} style={{ background: "transparent", border: "1px solid #c9a84c", color: "#c9a84c", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: "bold" }}>⬇ Excel</button>
            <button onClick={() => setVista(v => v === "config" ? "stock" : "config")} style={{ background: vista === "config" ? "#3a2e1a" : "transparent", border: "1px solid #3a2e1a", color: "#a89060", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>⚙ Config</button>
            <button onClick={apriAggiungi} style={{ background: "#c9a84c", border: "none", color: "#0d0d0f", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: "bold" }}>+ Aggiungi</button>
          </div>
        </div>
      </div>

      {vista === "config" ? (
        <div style={{ padding: isMobile ? "20px 16px" : "28px 32px", maxWidth: "600px" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: "18px", fontWeight: "normal", color: "#f5ead5" }}>⚙ Configurazione</h2>
          <div style={{ background: "#161410", border: "1px solid #2e2618", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "13px", color: "#c9a84c", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "normal" }}>Nome del bar</h3>
            <input value={barName} onChange={e => setBarName(e.target.value)} style={inputStyle} placeholder="Nome del bar..." />
          </div>
          <div style={{ background: "#161410", border: "1px solid #2e2618", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "13px", color: "#c9a84c", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "normal" }}>Categorie</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {categorie.map(cat => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0d0d0f", borderRadius: "8px", padding: "10px 14px" }}>
                  <input type="color" value={catColors[cat] || "#888"} onChange={e => aggiornaCatColore(cat, e.target.value)} style={{ width: "32px", height: "32px", border: "none", background: "none", cursor: "pointer", padding: 0 }} />
                  <span style={{ flex: 1, color: "#f0e8d5", fontSize: "14px" }}>{cat}</span>
                  <span style={{ fontSize: "12px", color: "#6a5a3a" }}>{products.filter(p => p.categoria === cat).length} prodotti</span>
                  <button onClick={() => eliminaCategoria(cat)} style={{ background: "transparent", border: "none", color: "#ff4444", cursor: "pointer", fontSize: "16px" }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={nuovaCat} onChange={e => setNuovaCat(e.target.value)} onKeyDown={e => e.key === "Enter" && aggiungiCategoria()} placeholder="Nuova categoria..." style={{ ...inputStyle, flex: 1 }} />
              <button onClick={aggiungiCategoria} style={{ ...btnPrimary, whiteSpace: "nowrap" }}>+ Aggiungi</button>
            </div>
          </div>
          <div style={{ background: "#161410", border: "1px solid #2e2618", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "13px", color: "#c9a84c", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "normal" }}>Tutti i prodotti ({products.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {products.map(p => (
                <div key={p.id} onClick={() => apriModifica(p)} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0d0d0f", borderRadius: "8px", padding: "10px 14px", cursor: "pointer", borderLeft: `3px solid ${catColors[p.categoria] || "#888"}` }}>
                  <span style={{ flex: 1, color: "#f0e8d5", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                  <span style={{ color: getStockColor(p), fontWeight: "bold" }}>{p.stock}</span>
                  <span style={{ color: "#6a5a3a", fontSize: "11px" }}>{p.unita}</span>
                  <span style={{ color: "#c9a84c" }}>›</span>
                </div>
              ))}
            </div>
            <button onClick={apriAggiungi} style={{ ...btnPrimary, width: "100%", marginTop: "12px" }}>+ Aggiungi prodotto</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: isMobile ? "12px 16px 0" : "14px 32px 0", display: "flex", gap: "10px", overflowX: "auto" }}>
            {[
              { label: "Totale", value: products.length, color: "#c9a84c" },
              { label: "Esauriti", value: products.filter(p => p.stock === 0).length, color: "#ff4444" },
              { label: "Bassi", value: products.filter(p => p.stock > 0 && p.stock <= p.minimo).length, color: "#ff9900" },
              { label: "OK", value: products.filter(p => p.stock > p.minimo).length, color: "#00c875" },
            ].map(s => (
              <div key={s.label} style={{ background: "#161410", border: `1px solid ${s.color}33`, borderRadius: "10px", padding: "10px 16px", textAlign: "center", minWidth: "70px", flex: 1 }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "#7a6a4a", letterSpacing: "1px", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: isMobile ? "12px 16px" : "14px 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <input placeholder="🔍 Cerca prodotto..." value={ricerca} onChange={e => setRicerca(e.target.value)}
              style={{ background: "#161410", border: "1px solid #2e2618", color: "#e8e0d0", padding: "10px 14px", borderRadius: "8px", fontSize: "16px", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {["Tutte", ...categorie].map(cat => (
                <button key={cat} onClick={() => setCategoriaAttiva(cat)} style={{
                  background: categoriaAttiva === cat ? (cat === "Tutte" ? "#c9a84c" : catColors[cat] || "#c9a84c") : "rgba(201,168,76,0.08)",
                  border: `1px solid ${categoriaAttiva === cat ? (cat === "Tutte" ? "#c9a84c" : catColors[cat] || "#c9a84c") : "#2e2618"}`,
                  color: categoriaAttiva === cat ? "#0d0d0f" : "#a89060",
                  padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
                  fontWeight: categoriaAttiva === cat ? "bold" : "normal", whiteSpace: "nowrap",
                }}>{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: isMobile ? "0 16px 40px" : "0 32px 40px" }}>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filtrati.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#4a3e28" }}>Nessun prodotto trovato</div>}
                {filtrati.map(p => (
                  <div key={p.id} onClick={() => apriModifica(p)} style={{ background: "#161410", border: `1px solid ${getStockColor(p)}33`, borderLeft: `4px solid ${catColors[p.categoria] || "#888"}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "bold", color: "#f0e8d5", fontSize: "15px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ background: `${catColors[p.categoria] || "#888"}22`, color: catColors[p.categoria] || "#888", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>{p.categoria}</span>
                        <span style={{ color: "#6a5a3a", fontSize: "12px" }}>min {p.minimo} {p.unita}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "26px", fontWeight: "bold", color: getStockColor(p), lineHeight: 1 }}>{p.stock}</div>
                      <div style={{ fontSize: "10px", color: getStockColor(p), fontWeight: "bold", letterSpacing: "1px" }}>{getStockLabel(p)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #2e2618" }}>
                      {["Prodotto","Categoria","Unità","Stock attuale","Minimo","Stato",""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#7a6a4a", fontWeight: "normal", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrati.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#4a3e28" }}>Nessun prodotto trovato</td></tr>}
                    {filtrati.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #1a1610", background: i % 2 === 0 ? "transparent" : "#0f0e0b" }}>
                        <td style={{ padding: "12px 14px", fontWeight: "500", color: "#f0e8d5", borderLeft: `3px solid ${catColors[p.categoria] || "#888"}` }}>{p.nome}</td>
                        <td style={{ padding: "12px 14px" }}><span style={{ background: `${catColors[p.categoria] || "#888"}22`, color: catColors[p.categoria] || "#888", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>{p.categoria}</span></td>
                        <td style={{ padding: "12px 14px", color: "#a09070" }}>{p.unita}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "bold", fontSize: "16px", color: getStockColor(p) }}>{p.stock}</td>
                        <td style={{ padding: "12px 14px", color: "#6a5a3a" }}>{p.minimo}</td>
                        <td style={{ padding: "12px 14px" }}><span style={{ background: `${getStockColor(p)}22`, color: getStockColor(p), padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", letterSpacing: "1px" }}>{getStockLabel(p)}</span></td>
                        <td style={{ padding: "12px 14px" }}><button onClick={() => apriModifica(p)} style={{ background: "transparent", border: "1px solid #2e2618", color: "#c9a84c", padding: "5px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>Modifica</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 100 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: "#161410", border: "1px solid #3a2e1a", borderRadius: isMobile ? "20px 20px 0 0" : "12px", padding: isMobile ? "24px 20px 36px" : "32px", width: isMobile ? "100%" : "min(460px,92vw)" }}>
            {isMobile && <div style={{ width: "40px", height: "4px", background: "#3a2e1a", borderRadius: "2px", margin: "0 auto 20px" }} />}
            <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "normal", color: "#f5ead5" }}>{modal.type === "add" ? "➕ Aggiungi prodotto" : "✏️ Modifica prodotto"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[{label:"Nome",key:"nome",type:"text"},{label:"Unità",key:"unita",type:"text"},{label:"Stock attuale",key:"stock",type:"number"},{label:"Stock minimo",key:"minimo",type:"number"}].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(prev => ({...prev,[f.key]:e.target.value}))} style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(prev => ({...prev,categoria:e.target.value}))} style={inputStyle}>
                  {categorie.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              {modal.type === "edit" && <button onClick={() => elimina(modal.product.id)} style={{ background:"transparent",border:"1px solid #ff4444",color:"#ff4444",padding:"11px 16px",borderRadius:"8px",cursor:"pointer",fontFamily:"inherit",fontSize:"14px",marginRight:"auto" }}>Elimina</button>}
              <button onClick={() => setModal(null)} style={btnGhost}>Annulla</button>
              <button onClick={salva} style={btnPrimary}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {mostraExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 200 }}
          onClick={e => e.target === e.currentTarget && setMostraExport(false)}>
          <div style={{ background: "#161410", border: "1px solid #3a2e1a", borderRadius: isMobile ? "20px 20px 0 0" : "12px", padding: isMobile ? "24px 16px 36px" : "28px 32px", width: isMobile ? "100%" : "min(720px,96vw)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            {isMobile && <div style={{ width: "40px", height: "4px", background: "#3a2e1a", borderRadius: "2px", margin: "0 auto 16px" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "normal", color: "#f5ead5" }}>📋 Dati per Excel</h2>
              <button onClick={() => setMostraExport(false)} style={{ background: "transparent", border: "none", color: "#7a6a4a", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#7a6a4a", letterSpacing: "1px" }}>SELEZIONA TUTTO → COPIA → INCOLLA IN EXCEL</p>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", userSelect: "all" }}>
                <thead>
                  <tr style={{ background: "#1a1208" }}>
                    {["Prodotto","Categoria","Unità","Stock","Minimo","Stato"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#c9a84c", fontWeight: "bold", borderBottom: "1px solid #3a2e1a", fontSize: "10px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const stato = p.stock === 0 ? "ESAURITO" : p.stock <= p.minimo ? "BASSE" : "OK";
                    const statoColor = p.stock === 0 ? "#ff4444" : p.stock <= p.minimo ? "#ff9900" : "#00c875";
                    return (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? "transparent" : "#0f0e0b" }}>
                        <td style={{ padding: "7px 10px", color: "#f0e8d5", borderBottom: "1px solid #1a1610" }}>{p.nome}</td>
                        <td style={{ padding: "7px 10px", color: "#a09070", borderBottom: "1px solid #1a1610" }}>{p.categoria}</td>
                        <td style={{ padding: "7px 10px", color: "#a09070", borderBottom: "1px solid #1a1610" }}>{p.unita}</td>
                        <td style={{ padding: "7px 10px", color: "#f0e8d5", fontWeight: "bold", borderBottom: "1px solid #1a1610" }}>{p.stock}</td>
                        <td style={{ padding: "7px 10px", color: "#6a5a3a", borderBottom: "1px solid #1a1610" }}>{p.minimo}</td>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #1a1610" }}><span style={{ color: statoColor, fontWeight: "bold", fontSize: "11px" }}>{stato}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => setMostraExport(false)} style={{ ...btnPrimary, width: "100%", marginTop: "16px", padding: "13px", fontSize: "15px" }}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}
