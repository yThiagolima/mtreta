window.Sales = (() => {
  const money=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const n=v=>Number(v)||0;
  function render(){
    const sales=Store.get("sales").slice().sort((a,b)=>b.date.localeCompare(a.date));
    document.getElementById("content").innerHTML=`<div class="page-head"><div><div class="eyebrow">OPERAÇÕES</div><h1>Vendas</h1><p>Registre vendas e acompanhe o lucro real de cada operação.</p></div><button class="btn primary" id="new-sale">＋ Nova venda</button></div>
    <div class="kpi-grid compact"><div class="kpi-card"><span>Vendas</span><strong>${sales.length}</strong></div><div class="kpi-card"><span>Recebido</span><strong>${money(sales.reduce((s,x)=>s+n(x.total),0))}</strong></div><div class="kpi-card"><span>Lucro bruto</span><strong class="positive">${money(sales.reduce((s,x)=>s+n(x.grossProfit),0))}</strong></div><div class="kpi-card"><span>Lucro real</span><strong class="positive">${money(sales.reduce((s,x)=>s+n(x.netProfit),0))}</strong></div></div>
    <div class="panel"><div class="panel-head"><div><h2>Histórico de vendas</h2><span>${sales.length} registros</span></div><input class="small-search" id="sales-search" placeholder="Buscar cliente ou produto"></div><div id="sales-table"></div></div>`;
    document.getElementById("new-sale").onclick=()=>openSale(); document.getElementById("sales-search").oninput=paint;paint();
  }
  function paint(){const q=(document.getElementById("sales-search")?.value||"").toLowerCase(), sales=Store.get("sales").filter(s=>(s.customer+" "+s.items.map(i=>i.name).join(" ")).toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));
    document.getElementById("sales-table").innerHTML=sales.length?`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Produto(s)</th><th>Cliente</th><th>Recebido</th><th>Custo</th><th>Lucro bruto</th><th>Lucro real</th><th>Entrega</th></tr></thead><tbody>${sales.map(s=>`<tr><td>${fmtDateTime(s.date)}</td><td><strong>${esc(s.items.map(i=>`${i.name} ×${i.qty}`).join(", "))}</strong></td><td>${esc(s.customer||"—")}</td><td>${money(s.total)}</td><td>${money(s.productCost)}</td><td class="positive">${money(s.grossProfit)}</td><td class="${s.netProfit>=0?"positive":"negative"}">${money(s.netProfit)}</td><td><span class="badge ${s.deliveryMethod==="delivered"?"info":"neutral"}">${s.deliveryMethod==="delivered"?"Entregue":"Retirada"}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">↗</div><h3>Nenhuma venda registrada</h3><p>Registre sua primeira venda para começar a acompanhar resultados.</p></div>`;
  }
  function openSale(){
    const products=Store.get("products").filter(p=>n(p.stock)>0);
    if(!products.length)return App.toast("Cadastre produtos com estoque disponível antes de vender.","error");
    App.modal(`<div class="modal-head"><div><div class="eyebrow">NOVA OPERAÇÃO</div><h2>Registrar venda</h2></div><button class="modal-close" data-close>×</button></div>
    <form id="sale-form" class="form"><div id="sale-items"></div><button type="button" class="btn ghost full" id="add-sale-item">＋ Adicionar produto</button>
    <div class="form-grid"><label>Cliente<input name="customer" placeholder="Nome do cliente"></label><label>Telefone<input name="phone" placeholder="(00) 00000-0000"></label><label>Data<input name="date" type="datetime-local" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></label><label>Como recebeu?<select name="deliveryMethod"><option value="pickup">Cliente retirou</option><option value="delivered">Eu entreguei</option></select></label></div>
    <div id="delivery-fields" class="subpanel hidden"></div><div class="form-grid"><label>Desconto<input name="discount" type="number" min="0" step="0.01" value="0"></label></div><label>Observações<textarea name="notes"></textarea></label>
    <div id="sale-summary" class="sale-summary"></div><div class="modal-actions"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">Registrar venda</button></div></form>`);
    let items=[];
    const renderItems=()=>{document.getElementById("sale-items").innerHTML=items.map((it,i)=>`<div class="sale-item"><select data-item="${i}" class="sale-product">${products.map(p=>`<option value="${p.id}" ${it.productId===p.id?"selected":""}>${esc(p.name)} — estoque ${p.stock}</option>`).join("")}</select><input data-qty="${i}" type="number" min="1" max="${products.find(p=>p.id===it.productId)?.stock||1}" value="${it.qty||1}"><input data-price="${i}" type="number" min="0" step="0.01" value="${it.price||products.find(p=>p.id===it.productId)?.salePrice||0}"><button type="button" class="icon-btn danger-icon" data-remove="${i}">×</button></div>`).join("");
      document.querySelectorAll("[data-item]").forEach(el=>el.onchange=e=>{const i=+e.target.dataset.item;items[i].productId=e.target.value;items[i].price=products.find(p=>p.id===e.target.value)?.salePrice||0;renderItems();update();});
      document.querySelectorAll("[data-qty]").forEach(el=>el.oninput=e=>{items[+e.target.dataset.qty].qty=Math.max(1,n(e.target.value));update()});
      document.querySelectorAll("[data-price]").forEach(el=>el.oninput=e=>{items[+e.target.dataset.price].price=Math.max(0,n(e.target.value));update()});
      document.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{items.splice(+el.dataset.remove,1);renderItems();update()});
    };
    const update=()=>{items.forEach(it=>{it.qty=n(it.qty)||1});const subtotal=items.reduce((s,it)=>s+n(it.qty)*n(it.price),0),discount=n(new FormData(document.getElementById("sale-form")).get("discount")), total=Math.max(0,subtotal-discount);document.getElementById("sale-summary").innerHTML=`<div><span>Subtotal</span><b>${money(subtotal)}</b></div><div><span>Desconto</span><b>− ${money(discount)}</b></div><div class="total"><span>Total recebido</span><b>${money(total)}</b></div>`};
    items.push({productId:products[0].id,qty:1,price:products[0].salePrice});renderItems();update();
    document.getElementById("add-sale-item").onclick=()=>{items.push({productId:products[0].id,qty:1,price:products[0].salePrice});renderItems();update()};
    document.getElementById("sale-form").oninput=update;
    document.querySelector('[name="deliveryMethod"]').onchange=e=>{document.getElementById("delivery-fields").classList.toggle("hidden",e.target.value!=="delivered");if(e.target.value==="delivered") Deliveries.mountSaleFields(document.getElementById("delivery-fields"));};
    document.getElementById("sale-form").onsubmit=e=>{e.preventDefault();if(!items.length)return App.toast("Adicione pelo menos um produto.","error");const fd=new FormData(e.target), discount=n(fd.get("discount"));const fullItems=items.map(it=>{const p=products.find(x=>x.id===it.productId);return {...it,name:p.name,costUnit:n(p.costUnit),price:n(it.price)}});for(const it of fullItems){const p=Store.get("products").find(x=>x.id===it.productId);if(!p||n(p.stock)<it.qty)return App.toast(`Estoque insuficiente para ${it.name}.`,"error");}
      const subtotal=fullItems.reduce((s,it)=>s+it.qty*it.price,0),total=Math.max(0,subtotal-discount),cost=fullItems.reduce((s,it)=>s+it.qty*it.costUnit,0), gross=total-cost;
      let gas=0, other=0, deliveryId=null;
      if(fd.get("deliveryMethod")==="delivered"){const d=Deliveries.fromSaleForm(new FormData(e.target));gas=d.gasCost;other=d.otherCosts;deliveryId=d.id;}
      const net=gross-gas-other; const sale={id:Store.uid("sale"),items:fullItems,customer:fd.get("customer"),phone:fd.get("phone"),date:new Date(fd.get("date")).toISOString(),discount,total,productCost:cost,grossProfit:gross,gasCost:gas,otherCosts:other,netProfit:net,deliveryMethod:fd.get("deliveryMethod"),deliveryId,notes:fd.get("notes")};
      Store.add("sales",sale); Store.update("products",arr=>arr.map(p=>{const it=fullItems.find(i=>i.productId===p.id);return it?{...p,stock:n(p.stock)-it.qty}:p;}));
      if(deliveryId) Store.update("deliveries",arr=>arr.map(d=>d.id===deliveryId?{...d,saleId:sale.id}:d));
      Store.add("history",{id:Store.uid("hist"),type:"venda",description:`Venda registrada${sale.customer?` para ${sale.customer}`:""}`,date:sale.date,saleId:sale.id});
      App.closeModal();App.toast("Venda registrada com sucesso.","success");render();
    };
  }
  function fmtDateTime(d){return new Date(d).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});}
  return {render,openSale};
})();