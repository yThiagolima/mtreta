/* Camada de persistência: substituível futuramente por Supabase sem alterar as telas. */
(() => {
  const KEY = "estoque_thiago_v1";
  const defaults = {
    products: [], sales: [], deliveries: [], costs: [], history: [],
    settings: {
      motorcycle: { model: "", consumption: 30, gasPrice: 6.20 },
      minStock: 2, currency: "BRL", theme: "light"
    }
  };

  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function merge(base, value){
    if (!value || typeof value !== "object") return clone(base);
    const out = clone(base);
    Object.keys(value).forEach(k => {
      if (value[k] && typeof value[k] === "object" && !Array.isArray(value[k]) && out[k]) out[k] = merge(out[k], value[k]);
      else out[k] = value[k];
    });
    return out;
  }
  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(defaults);
      return merge(defaults, JSON.parse(raw));
    } catch(e){ return clone(defaults); }
  }
  let db = load();
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch(e){ alert("Não foi possível salvar os dados neste navegador."); return false; }
  }
  window.Store = {
    get: (collection) => db[collection],
    all: () => db,
    set(collection, value){ db[collection] = value; persist(); },
    update(collection, fn){ db[collection] = fn(db[collection]); persist(); },
    add(collection, value){ db[collection].push(value); persist(); return value; },
    remove(collection, id){ db[collection] = db[collection].filter(x => x.id !== id); persist(); },
    save(){ persist(); },
    reset(){
      db = clone(defaults); persist(); return db;
    },
    exportJSON(){
      return JSON.stringify(db, null, 2);
    },
    importJSON(raw){
      const parsed = JSON.parse(raw);
      db = merge(defaults, parsed);
      persist();
      return db;
    },
    uid(prefix="id"){ return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8); }
  };
})();