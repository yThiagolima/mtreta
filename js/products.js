window.Products = (() => {
  const esc = window.escapeHtml || (s => String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])));
  const money = v => (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const num = v => Number(v)||0;
  const calc = p => {
    const cost = num(p.costUnit), price = num(p.salePrice);
    const profit = price - cost, margin = price > 0 ? profit/price*100 : 0;
    return {profit, margin, totalCost: cost*num(p.quantityPurchased)};
  };
  function status(p){
    const q=num(p.stock);
    if(q<=0) return ["Esgotado","danger"];
    if(q<=num(Store.get("settings").minStock)) return ["Estoque baixo","warning"];
    return ["Estoque normal","success"];
  }
  function render(){
    const root=document.getElementById("content"), list=Store.get("products");
    root.innerHTML=`
      <div class="page-head"><div><div class="eyebrow">CATÁLOGO</div><h1>Produtos</h1><p>Controle compras, estoque, preços e margens em um só lugar.</p></div>
      <div class="head-actions"><button class="btn ghost" id="products-table-toggle">▤ Tabela</button><button class="btn primary" id="add-product">＋ Novo produto</button></div></div>
      <div class="toolbar"><div class="input-search"><span>⌕</span><input id="product-search" placeholder="Pesquisar produto, marca, SKU..."></div>
      <select id="product-category"><option value="">Todas as categorias</option>${[...new Set(list.map(p=>p.category).filter(Boolean))].sort().map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <select id="product-stock"><option value="">Todos os estoques</option><option value="normal">Normal</option><option value="low">Baixo</option><option value="out">Esgotado</option></select>
      <select id="product-sort"><option value="name">Nome A–Z</option><option value="stock">Estoque</option><option value="profit">Maior lucro/un.</option><option value="new">Mais recentes</option></select></div>
      <div id="products-summary" class="mini-stats"></div><div id="products-list" class="products-grid"></div>`;
    document.getElementById("add-product").onclick=()=>openProduct();
    document.getElementById("products-table-toggle").onclick=()=>toggleView();
    ["product-search","product-category","product-stock","product-sort"].forEach(id=>document.getElementById(id).oninput=paint);
    paint();
  }
  function paint(){
    const list=Store.get("products").slice(), q=(document.getElementById("product-search")?.value||"").toLowerCase();
    const cat=document.getElementById("product-category")?.value||"", st=document.getElementById("product-stock")?.value||"", sort=document.getElementById("product-sort")?.value||"name";
    let arr=list.filter(p=>(`${p.name} ${p.brand} ${p.model} ${p.sku} ${p.category}`).toLowerCase().includes(q)&&(!cat||p.category===cat));
    arr=arr.filter(p=>!st||(st==="normal"&&status(p)[1]==="success")||(st==="low"&&status(p)[1]==="warning")||(st==="out"&&status(p)[1]==="danger"));
    arr.sort((a,b)=>sort==="stock"?num(b.stock)-num(a.stock):sort==="profit"?calc(b).profit-calc(a).profit:sort==="new"?String(b.purchaseDate).localeCompare(String(a.purchaseDate)):a.name.localeCompare(b.name));
    const totalUnits=list.reduce((s,p)=>s+num(p.stock),0), invest=list.reduce((s,p)=>s+num(p.stock)*num(p.costUnit),0);
    document.getElementById("products-summary").innerHTML=`<div class="mini-stat"><span>Produtos</span><b>${list.length}</b></div><div class="mini-stat"><span>Unidades em estoque</span><b>${totalUnits}</b></div><div class="mini-stat"><span>Capital no estoque</span><b>${money(invest)}</b></div>`;
    const root=document.getElementById("products-list");
    if(!arr.length){root.innerHTML=`<div class="empty-state wide"><div class="empty-icon">▦</div><h3>Nenhum produto encontrado</h3><p>Cadastre seu primeiro produto para começar.</p><button class="btn primary" onclick="Products.openProduct()">＋ Cadastrar produto</button></div>`;return;}
    root.innerHTML=arr.map(p=>{
      const c=calc(p), [label,cls]=status(p), photo=p.photo?`<img src="${esc(p.photo)}" alt="">`:`<div class="product-placeholder">▦</div>`;
      return `<article class="product-card"><div class="product-image">${photo}<span class="badge ${cls}">${label}</span></div><div class="product-body"><div class="product-title"><h3>${esc(p.name)}</h3><span>${esc(p.brand||"")}${p.model?` · ${esc(p.model)}`:""}</span></div><div class="product-meta"><span>Estoque <b>${num(p.stock)}</b></span><span>SKU <b>${esc(p.sku||"—")}</b></span></div><div class="price-row"><div><small>Custo</small><strong>${money(p.costUnit)}</strong></div><div><small>Venda</small><strong>${money(p.salePrice)}</strong></div><div><small>Lucro/un.</small><strong class="positive">${money(c.profit)}</strong></div></div><div class="margin-bar"><span style="width:${Math.max(0,Math.min(100,c.margin))}%"></span></div><div class="product-footer"><span>Margem <b>${c.margin.toFixed(2)}%</b></span><div><button class="text-btn" onclick="Products.openProduct('${p.id}')">Editar</button><button class="text-btn danger-text" onclick="Products.deleteProduct('${p.id}')">Excluir</button></div></div></div></article>`;
    }).join("");
  }
  function openProduct(id){
    const p=id?Store.get("products").find(x=>x.id===id):{quantityPurchased:0,stock:0,costUnit:0,salePrice:0,purchaseDate:new Date().toISOString().slice(0,10)};
    const isEdit=!!id;
    App.modal(`<div class="modal-head"><div><div class="eyebrow">${isEdit?"EDITAR":"NOVO"}</div><h2>${isEdit?"Editar produto":"Cadastrar produto"}</h2></div><button class="modal-close" data-close>×</button></div>
    <form id="product-form" class="form"><div class="photo-field"><div id="photo-preview" class="photo-preview">${p.photo?`<img src="${esc(p.photo)}">`:"＋"}</div><div><label>Foto do produto</label><input id="p-photo" type="file" accept="image/*"><small>Opcional · JPG/PNG/WebP</small></div></div>
    <div class="form-grid"><label>Nome *<input name="name" required value="${esc(p.name||"")}"></label><label>Marca<input name="brand" value="${esc(p.brand||"")}"></label><label>Modelo<input name="model" value="${esc(p.model||"")}"></label><label>Categoria<input name="category" value="${esc(p.category||"")}"></label><label>SKU / Código<input name="sku" value="${esc(p.sku||"")}"></label><label>Fornecedor<input name="supplier" value="${esc(p.supplier||"")}"></label><label>Quantidade comprada *<input name="quantityPurchased" type="number" min="0" step="1" value="${num(p.quantityPurchased)}"></label><label>Estoque atual *<input name="stock" type="number" min="0" step="1" value="${num(p.stock)}"></label><label>Valor pago/un. *<input name="costUnit" type="number" min="0" step="0.01" value="${num(p.costUnit)}"></label><label>Preço de venda *<input name="salePrice" type="number" min="0" step="0.01" value="${num(p.salePrice)}"></label><label>Data da compra<input name="purchaseDate" type="date" value="${esc(p.purchaseDate||"")}"></label><label>Link da compra<input name="purchaseLink" type="url" value="${esc(p.purchaseLink||"")}"></label></div><label>Observações<textarea name="notes">${esc(p.notes||"")}</textarea></label>
    <div class="form-preview" id="product-profit-preview"></div><div class="modal-actions"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">${isEdit?"Salvar alterações":"Cadastrar produto"}</button></div></form>`);
    const form=document.getElementById("product-form"), photo=document.getElementById("p-photo");
    const update=()=>{const fd=new FormData(form), c=calc(Object.fromEntries(fd));document.getElementById("product-profit-preview").innerHTML=`Lucro por unidade <b>${money(c.profit)}</b> · Margem <b>${c.margin.toFixed(2)}%</b>`}; form.oninput=update; update();
    photo.onchange=()=>{const f=photo.files?.[0];if(!f)return;const r=new FileReader();r.onload=e=>{p._newPhoto=e.target.result;document.getElementById("photo-preview").innerHTML=`<img src="${e.target.result}">`};r.readAsDataURL(f)};
    form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form), data=Object.fromEntries(fd);if(!data.name.trim())return;
      const item={...(isEdit?p:{id:Store.uid("prod")}),...data,quantityPurchased:num(data.quantityPurchased),stock:num(data.stock),costUnit:num(data.costUnit),salePrice:num(data.salePrice),photo:p._newPhoto||p.photo||"",updatedAt:new Date().toISOString()};
      if(!isEdit) item.createdAt=new Date().toISOString();
      if(isEdit) Store.update("products",a=>a.map(x=>x.id===id?item:x)); else Store.add("products",item);
      Store.add("history",{id:Store.uid("hist"),type:isEdit?"alteração":"compra",description:`${isEdit?"Produto alterado":"Produto cadastrado"}: ${item.name}`,date:new Date().toISOString(),productId:item.id});
      App.closeModal();App.toast(isEdit?"Produto atualizado com sucesso.":"Produto cadastrado com sucesso.","success");render();
    };
  }
  function deleteProduct(id){
    const p=Store.get("products").find(x=>x.id===id); if(!p)return;
    if(Store.get("sales").some(s=>s.items?.some(i=>i.productId===id))) return App.toast("Este produto possui vendas e não pode ser excluído. Edite-o ou deixe o estoque zerado.","error");
    if(confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)){Store.remove("products",id);Store.add("history",{id:Store.uid("hist"),type:"exclusão",description:`Produto excluído: ${p.name}`,date:new Date().toISOString()});App.toast("Produto excluído.","success");render();}
  }
  function toggleView(){const root=document.getElementById("products-list");root.classList.toggle("table-view");if(root.classList.contains("table-view")) paintTable(); else paint();}
  function paintTable(){const list=Store.get("products"), root=document.getElementById("products-list");root.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Produto</th><th>SKU</th><th>Estoque</th><th>Custo</th><th>Venda</th><th>Lucro/un.</th><th>Margem</th><th></th></tr></thead><tbody>${list.map(p=>{const c=calc(p),s=status(p);return `<tr><td><strong>${esc(p.name)}</strong><small>${esc(p.brand||"")}</small></td><td>${esc(p.sku||"—")}</td><td><span class="badge ${s[1]}">${p.stock}</span></td><td>${money(p.costUnit)}</td><td>${money(p.salePrice)}</td><td class="positive">${money(c.profit)}</td><td>${c.margin.toFixed(1)}%</td><td><button class="text-btn" onclick="Products.openProduct('${p.id}')">Editar</button></td></tr>`}).join("")}</tbody></table></div>`}
  return {render,openProduct,deleteProduct,paint};
})();