export const dashboardHtml = /* html */ `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>hookrelay</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0b0f17;color:#e5e7eb}
header{padding:20px 24px;border-bottom:1px solid #1f2937}header h1{margin:0;font-size:18px}
main{padding:20px 24px;max-width:1000px;margin:0 auto;display:grid;grid-template-columns:340px 1fr;gap:20px}
@media(max-width:800px){main{grid-template-columns:1fr}}
.panel{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px}
input,textarea{width:100%;background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:8px;padding:9px;font:inherit;margin-bottom:8px}
button{background:#2563eb;border:0;color:#fff;padding:9px 13px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}
.ep{padding:10px;border:1px solid #1f2937;border-radius:8px;margin-bottom:8px;cursor:pointer}.ep:hover{border-color:#374151}
.ep.sel{border-color:#2563eb}.ep .u{font-family:ui-monospace,monospace;font-size:11px;color:#60a5fa;word-break:break-all}
.req{border-top:1px solid #1f2937;padding:10px 0}.method{font-family:ui-monospace,monospace;font-weight:700}
.pill{font-size:11px;padding:1px 7px;border-radius:20px;margin-left:6px}
.ok{background:#064e3b;color:#6ee7b7}.bad{background:#7f1d1d;color:#fca5a5}.muted{color:#6b7280}
pre{background:#0b0f17;border:1px solid #374151;border-radius:8px;padding:10px;overflow:auto;font-size:12px;max-height:180px}
small{color:#6b7280}
</style></head><body>
<header><h1>🪝 hookrelay</h1></header>
<main>
  <div>
    <div class="panel">
      <b>Novo endpoint</b>
      <input id="n-name" placeholder="nome (ex: github-ci)"/>
      <textarea id="n-targets" placeholder="targets, um por linha&#10;https://...&#10;https://..."></textarea>
      <input id="n-secret" placeholder="HMAC secret (opcional)"/>
      <button id="add">Criar</button>
    </div>
    <div id="eps" style="margin-top:14px"></div>
  </div>
  <div class="panel" id="detail"><span class="muted">Selecione um endpoint.</span></div>
</main>
<script>
var sel=null;
function esc(s){return (s||'').replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
async function load(){
  var d=await (await fetch('/api/endpoints')).json();
  document.getElementById('eps').innerHTML=d.endpoints.map(function(e){
    return '<div class="ep '+(e.token===sel?'sel':'')+'" data-t="'+e.token+'"><b>'+esc(e.name)+'</b>'+
      (e.hmacSecret?' <span class="pill ok">HMAC</span>':'')+
      '<div class="u">'+location.origin+'/h/'+e.token+'</div>'+
      '<small>'+e.targets.length+' target(s) · '+e.requests.length+' req</small></div>';
  }).join('')||'<span class="muted">Nenhum endpoint.</span>';
  document.querySelectorAll('.ep').forEach(function(el){el.onclick=function(){sel=el.dataset.t;load();detail();};});
  if(sel)detail();
}
async function detail(){
  var e=await (await fetch('/api/endpoints/'+sel)).json();
  if(e.error){document.getElementById('detail').innerHTML='<span class="muted">Removido.</span>';sel=null;return;}
  document.getElementById('detail').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center">'+
    '<b>'+esc(e.name)+'</b><button style="background:#374151" id="del">remover</button></div>'+
    '<div class="u" style="font-family:ui-monospace,monospace;color:#60a5fa;margin:8px 0">POST '+location.origin+'/h/'+e.token+'</div>'+
    '<small>targets: '+e.targets.map(esc).join(', ')+'</small>'+
    (e.requests.length?e.requests.map(function(r){
      var hm=r.hmacValid===null?'':'<span class="pill '+(r.hmacValid?'ok':'bad')+'">HMAC '+(r.hmacValid?'ok':'fail')+'</span>';
      var dl=r.deliveries.map(function(d){return '<span class="pill '+(d.ok?'ok':'bad')+'">'+esc(d.target.replace(/^https?:\\/\\//,''))+' '+d.status+' ×'+d.attempts+'</span>';}).join(' ');
      return '<div class="req"><span class="method">'+r.method+'</span>'+hm+' <small>'+new Date(r.receivedAt).toLocaleString()+'</small>'+
        '<div style="margin:6px 0">'+dl+'</div><pre>'+esc(r.body)+'</pre></div>';
    }).join(''):'<div class="req muted">Sem requisições ainda. Faça um POST no endpoint.</div>');
  var db=document.getElementById('del');if(db)db.onclick=async function(){await fetch('/api/endpoints/'+sel,{method:'DELETE'});sel=null;document.getElementById('detail').innerHTML='<span class="muted">Removido.</span>';load();};
}
document.getElementById('add').onclick=async function(){
  var name=document.getElementById('n-name').value.trim();if(!name)return;
  var targets=document.getElementById('n-targets').value.split('\\n').map(function(s){return s.trim();}).filter(Boolean);
  await fetch('/api/endpoints',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name:name,targets:targets,hmacSecret:document.getElementById('n-secret').value.trim()||undefined})});
  document.getElementById('n-name').value='';document.getElementById('n-targets').value='';document.getElementById('n-secret').value='';load();
};
load();setInterval(function(){if(sel)detail();load();},8000);
</script></body></html>`;
