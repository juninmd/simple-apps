export const dashboardHtml = /* html */ `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>jobrunner</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0b0f17;color:#e5e7eb}
header{padding:20px 24px;border-bottom:1px solid #1f2937}header h1{margin:0;font-size:18px}
main{padding:20px 24px;max-width:960px;margin:0 auto}
.form{display:grid;grid-template-columns:2fr 3fr 90px 90px auto;gap:8px;margin-bottom:20px}
input,select{background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:8px;padding:9px;font:inherit}
button{background:#2563eb;border:0;color:#fff;padding:9px 12px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}button.mini{background:#374151;padding:5px 9px;font-size:12px;margin-left:4px}
table{width:100%;border-collapse:collapse}th{text-align:left;color:#6b7280;font-weight:500;font-size:12px;padding:8px}
td{padding:10px 8px;border-top:1px solid #1f2937;vertical-align:middle}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:6px}
.ok{background:#22c55e}.bad{background:#ef4444}.off{background:#6b7280}
.spark{display:inline-flex;gap:2px;vertical-align:middle}.spark i{width:5px;height:14px;border-radius:1px;display:inline-block}
.muted{color:#6b7280}.mono{font-family:ui-monospace,monospace;font-size:12px}
</style></head><body>
<header><h1>⚙️ jobrunner</h1></header>
<main>
  <div class="form">
    <input id="j-name" placeholder="nome"/>
    <input id="j-url" placeholder="https://url-a-chamar"/>
    <select id="j-method"><option>GET</option><option>POST</option><option>PUT</option></select>
    <input id="j-int" type="number" value="3600" title="intervalo (s)"/>
    <button id="add">Agendar</button>
  </div>
  <table><thead><tr><th></th><th>Job</th><th>Intervalo</th><th>Último</th><th>Runs</th><th>Histórico</th><th></th></tr></thead>
  <tbody id="rows"></tbody></table>
</main>
<script>
function ago(ts){if(!ts)return '—';var s=Math.floor((Date.now()-ts)/1000);if(s<60)return s+'s';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d';}
function dur(sec){if(sec<60)return sec+'s';if(sec<3600)return Math.round(sec/60)+'m';if(sec<86400)return Math.round(sec/3600)+'h';return Math.round(sec/86400)+'d';}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
async function load(){
  var d=await (await fetch('/api/jobs')).json();
  document.getElementById('rows').innerHTML=d.jobs.map(function(j){
    var cls=!j.enabled?'off':j.lastOk===null?'off':j.lastOk?'ok':'bad';
    var spark=j.history.slice(0,12).reverse().map(function(r){return '<i class="'+(r.ok?'ok':'bad')+'" title="'+esc(r.status)+'"></i>';}).join('');
    var last=j.lastRun?(ago(j.lastRun)+' atrás · '+(j.lastOk?'ok':'falha')):'nunca';
    return '<tr><td><span class="dot '+cls+'"></span></td>'+
      '<td>'+esc(j.name)+'<div class="mono muted">'+esc(j.method)+' '+esc(j.url)+'</div></td>'+
      '<td>'+dur(j.intervalSec)+'</td><td>'+last+'</td><td>'+j.runs+'</td>'+
      '<td><span class="spark">'+spark+'</span></td>'+
      '<td style="white-space:nowrap"><button class="mini" data-run="'+esc(j.id)+'">▶</button>'+
      '<button class="mini" data-tog="'+esc(j.id)+'">'+(j.enabled?'pausar':'ativar')+'</button>'+
      '<button class="mini" data-del="'+esc(j.id)+'">×</button></td></tr>';
  }).join('')||'<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">Nenhum job.</td></tr>';
  document.querySelectorAll('[data-run]').forEach(function(b){b.onclick=async function(){await fetch('/api/jobs/'+b.dataset.run+'/run',{method:'POST'});setTimeout(load,600);};});
  document.querySelectorAll('[data-tog]').forEach(function(b){b.onclick=async function(){await fetch('/api/jobs/'+b.dataset.tog+'/toggle',{method:'POST'});load();};});
  document.querySelectorAll('[data-del]').forEach(function(b){b.onclick=async function(){await fetch('/api/jobs/'+b.dataset.del,{method:'DELETE'});load();};});
}
document.getElementById('add').onclick=async function(){
  var name=document.getElementById('j-name').value.trim(),url=document.getElementById('j-url').value.trim();
  if(!name||!url)return;
  await fetch('/api/jobs',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name:name,url:url,method:document.getElementById('j-method').value,intervalSec:+document.getElementById('j-int').value})});
  document.getElementById('j-name').value='';document.getElementById('j-url').value='';load();
};
load();setInterval(load,5000);
</script></body></html>`;
