export const dashboardHtml = /* html */ `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>cron-sentinel</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0b0f17;color:#e5e7eb}
header{padding:20px 24px;border-bottom:1px solid #1f2937;display:flex;align-items:baseline;gap:12px}
header h1{margin:0;font-size:18px} .sub{color:#6b7280;font-size:12px}
main{padding:20px 24px;max-width:900px;margin:0 auto}
.new-form{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;margin-bottom:20px}
input{background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:8px;padding:10px;font:inherit}
button{background:#2563eb;border:0;color:#fff;padding:10px 14px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8} button.del{background:#374151;padding:6px 10px;font-size:12px}
table{width:100%;border-collapse:collapse} th{text-align:left;color:#6b7280;font-weight:500;font-size:12px;padding:8px}
td{padding:10px 8px;border-top:1px solid #1f2937;vertical-align:middle}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:7px}
.up{background:#22c55e}.late{background:#f59e0b}.down{background:#ef4444}.new{background:#6b7280}
code{background:#0b0f17;border:1px solid #374151;border-radius:6px;padding:2px 7px;font-size:12px;cursor:pointer}
.st{text-transform:uppercase;font-size:11px;letter-spacing:.5px}
</style></head><body>
<header><h1>⏱️ cron-sentinel</h1><span class="sub" id="sub"></span></header>
<main>
  <div class="new-form">
    <input id="n-name" placeholder="nome do job (ex: dinheirama-daily)"/>
    <input id="n-period" type="number" placeholder="período (s)" value="86400"/>
    <input id="n-grace" type="number" placeholder="folga (s)" value="3600"/>
    <button id="add">Criar check</button>
  </div>
  <table><thead><tr><th>Job</th><th>Status</th><th>Último ping</th><th>Pings</th><th>Ping URL</th><th></th></tr></thead>
  <tbody id="rows"></tbody></table>
</main>
<script>
function ago(ts){if(!ts)return 'nunca';var s=Math.floor((Date.now()-ts)/1000);
  if(s<60)return s+'s';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d';}
async function load(){
  var r=await fetch('/api/checks');var d=await r.json();
  document.getElementById('sub').textContent=d.checks.length+' checks · '+d.checks.filter(function(c){return c.status==='down';}).length+' down';
  document.getElementById('rows').innerHTML=d.checks.map(function(c){
    var url=location.origin+'/ping/'+c.id;
    return '<tr><td>'+c.name+'</td>'+
      '<td><span class="dot '+c.status+'"></span><span class="st">'+c.status+'</span></td>'+
      '<td>'+ago(c.lastPing)+'</td><td>'+c.pings+'</td>'+
      '<td><code data-u="'+url+'" title="clique p/ copiar">'+url+'</code></td>'+
      '<td><button class="del" data-id="'+c.id+'">remover</button></td></tr>';
  }).join('')||'<tr><td colspan="6" style="color:#6b7280;padding:24px;text-align:center">Nenhum check ainda.</td></tr>';
  document.querySelectorAll('code[data-u]').forEach(function(el){el.onclick=function(){navigator.clipboard.writeText(el.dataset.u);el.textContent='copiado ✓';};});
  document.querySelectorAll('.del').forEach(function(b){b.onclick=async function(){await fetch('/api/checks/'+b.dataset.id,{method:'DELETE'});load();};});
}
document.getElementById('add').onclick=async function(){
  var name=document.getElementById('n-name').value.trim();if(!name)return;
  await fetch('/api/checks',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name:name,periodSec:+document.getElementById('n-period').value,graceSec:+document.getElementById('n-grace').value})});
  document.getElementById('n-name').value='';load();
};
load();setInterval(load,10000);
</script></body></html>`;
