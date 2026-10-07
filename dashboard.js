ET.Dashboard=(()=>{const{esc,money}=ET;let k='30',from='',to='';
 const range=()=>{const d=new Date(),f=x=>new Date(+x-d.getTimezoneOffset()*6e4).toISOString().slice(0,10),t=f(d),ago=m=>f(d.getTime()-m*864e5),y=d.getFullYear(),m=d.getMonth();
  return{today:[t,t],7:[ago(6),t],30:[ago(29),t],month:[f(new Date(y,m,1)),t],prev:[f(new Date(y,m-1,1)),f(new Date(y,m,0))],custom:[from||'0000',to||'9999']}[k]};
 const metrics=()=>{const[a,b]=range(),ss=ET.Storage.get().sales.filter(s=>s.date>=a&&s.date<=b),m={n:ss.length,rev:0,cost:0,fuel:0,extra:0,km:0,sales:ss};
  ss.forEach(s=>{const c=ET.Sales.calc(s);m.rev+=s.received;m.cost+=s.cost;m.fuel+=c.fuel;m.extra+=c.extra;m.km+=s.delivery?s.delivery.km:0});m.gross=m.rev-m.cost;m.real=m.gross-m.fuel-m.extra;return m};
 const filterBar=()=>`<div class="bar-t"><select data-in="dash.k">${[['today','Hoje'],['7','Últimos 7 dias'],['30','Últimos 30 dias'],['month','Este mês'],['prev','Mês anterior'],['custom','Personalizado']].map(o=>`<option value="${o[0]}" ${k===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>${k==='custom'?`<input type="date" value="${from}" data-in="dash.from"><input type="date" value="${to}" data-in="dash.to">`:''}</div>`;
 const group=(ss,fn)=>{const m={};ss.forEach(s=>m[s.date]=(m[s.date]||0)+fn(s));return Object.keys(m).sort().slice(-31).map(d=>({l:d.slice(8)+'/'+d.slice(5,7),v:m[d]}))};
 const bars=it=>{if(!it.length)return'<div class="empty">Sem dados no período.</div>';const mx=Math.max(...it.map(i=>Math.abs(i.v)),1);return`<div class="bars">${it.map(i=>`<div class="bar" title="${i.l}: ${money(i.v)}"><span class="${i.v<0?'n':''}" style="height:${Math.abs(i.v)/mx*85}%"></span><em>${i.l}</em></div>`).join('')}</div>`};
 const hbars=(it,f=money)=>{if(!it.length)return'<div class="empty">Sem dados no período.</div>';const mx=Math.max(...it.map(i=>i.v),1);return it.map(i=>`<div class="hb"><label title="${esc(i.l)}">${esc(i.l)}</label><div><i style="width:${Math.max(i.v/mx*100,2)}%"></i></div><b>${f(i.v)}</b></div>`).join('')};
 const alerts=()=>{const db=ET.Storage.get(),a=[],d=new Date(),t=ET.today(),ago=new Date(Date.now()-6*864e5-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  db.products.forEach(p=>{if(p.stock<=0)a.push(['b',`${esc(p.name)} está esgotado.`]);else if(p.stock<=db.settings.minStock)a.push(['w',`${esc(p.name)} está com estoque baixo (${p.stock} un.).`])});
  const w=db.sales.filter(s=>s.date>=ago&&s.date<=t).reduce((x,s)=>x+ET.Sales.calc(s).real,0);if(db.sales.length)a.push(['',`Você teve ${money(w)} de lucro real nos últimos 7 dias.`]);
  const mo=db.sales.filter(s=>s.date.slice(0,7)===t.slice(0,7)).reduce((x,s)=>x+(s.delivery?s.delivery.cost:0),0);if(mo>0)a.push(['w',`Os gastos com gasolina neste mês foram ${money(mo)}.`]);
  return a.length?a.map(x=>`<div class="al ${x[0]}">${x[1]}</div>`).join(''):'<div class="empty">Nenhum alerta no momento.</div>'};
 const render=()=>{const db=ET.Storage.get(),m=metrics(),ps=db.products,inv=ps.reduce((a,p)=>a+p.stock*p.unitCost,0),val=ps.reduce((a,p)=>a+p.stock*p.price,0),items=ps.reduce((a,p)=>a+p.stock,0);
  const low=ps.filter(p=>p.stock>0&&p.stock<=db.settings.minStock).length,out=ps.filter(p=>p.stock<=0).length,K=(l,v,c='')=>`<div class="card kpi ${c}"><small>${l}</small><b>${v}</b></div>`;
  const top={};m.sales.forEach(s=>top[s.productName]=(top[s.productName]||0)+s.qty);
  return`<div class="ph-h"><div><h2>Dashboard</h2><span class="mut">Visão geral do seu negócio</span></div><button class="btn pri" data-act="sale.add">+ Nova venda</button></div>${filterBar()}
  <div class="kpis">${K('Lucro líquido (real)',money(m.real),'hl')}${K('Lucro bruto',money(m.gross))}${K('Total recebido',money(m.rev))}${K('Total de vendas',m.n)}${K('Custo dos produtos vendidos',money(m.cost))}${K('Gastos com gasolina',money(m.fuel))}</div>
  <div class="kpis">${K('Investido em estoque',money(inv))}${K('Estoque a preço de venda',money(val))}${K('Lucro potencial',money(val-inv))}${K('Produtos cadastrados',ps.length)}${K('Itens em estoque',items)}${K('Estoque baixo',low)}${K('Esgotados',out)}</div>
  <h3>Alertas</h3><div style="margin-bottom:18px">${alerts()}</div>
  <div class="grid2"><div class="card"><h3>Vendas por período</h3>${bars(group(m.sales,s=>s.received))}</div><div class="card"><h3>Lucro real por período</h3>${bars(group(m.sales,s=>ET.Sales.calc(s).real))}</div>
  <div class="card"><h3>Produtos mais vendidos</h3>${hbars(Object.entries(top).map(([l,v])=>({l,v})).sort((a,b)=>b.v-a.v).slice(0,6),v=>v+' un.')}</div><div class="card"><h3>Gastos com gasolina</h3>${bars(group(m.sales,s=>s.delivery?s.delivery.cost:0))}</div>
  <div class="card"><h3>Estoque atual por produto</h3>${hbars(ps.filter(p=>p.stock>0).map(p=>({l:p.name,v:p.stock})).sort((a,b)=>b.v-a.v).slice(0,6),v=>v+' un.')}</div></div>`};
 Object.assign(ET.act,{'dash.k':v=>{k=v;ET.go()},'dash.from':v=>{from=v;ET.go()},'dash.to':v=>{to=v;ET.go()}});
 return{render,metrics,filterBar,bars,hbars,range}})();
