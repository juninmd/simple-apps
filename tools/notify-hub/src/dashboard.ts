export const dashboardHtml = /* html */ `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>notify-hub</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0b0f17;color:#e5e7eb}
header{padding:20px 24px;border-bottom:1px solid #1f2937}header h1{margin:0;font-size:18px}
main{padding:20px 24px;max-width:900px;margin:0 auto}
.panel{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;margin-bottom:16px}
input,textarea,select{width:100%;background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:8px;padding:9px;font:inherit;margin-bottom:8px}
button{background:#2563eb;border:0;color:#fff;padding:9px 13px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}button.mini{background:#374151;padding:5px 9px;font-size:12px}
.sink-row{display:grid;grid-template-columns:130px 1fr auto;gap:8px}
.topic{border:1px solid #1f2937;border-radius:10px;padding:12px;margin-bottom:10px}
.tok{font-family:ui-monospace,monospace;color:#60a5fa;cursor:pointer;font-size:12px}
.pill{font-size:11px;padding:1px 7px;border-radius:20px;margin-right:4px}.tg{background:#164e63;color:#a5f3fc}.dc{background:#3730a3;color:#c7d2fe}.wh{background:#374151;color:#d1d5db}
.err{color:#ef4444}.muted{color:#6b7280}.ok{color:#22c55e}
code{background:#0b0f17;border:1px solid #374151;border-radius:6px;padding:2px 6px;font-size:12px}
</style></head><body>
<header><h1>📣 notify-hub</h1></header>
<main>
  <div class="panel">
    <b>Novo tópico</b>
    <input id="t-name" placeholder="nome (ex: alerts, deploys)"/>
    <div id="sinks"></div>
    <button class="mini" id="add-sink" style="margin:4px 0 10px">+ sink</button>
    <button id="create">Criar tópico</button>
    <div id="err"></div>
  </div>
  <div id="list"></div>
</main>
<script>
function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function sinkRow(){var d=document.createElement('div');d.className='sink-row';
  d.innerHTML='<select><option value="telegram">telegram</option><option value="discord">discord</option><option value="webhook">webhook</option></select>'+
    '<input placeholder="chat_id / webhook URL"/><button class="mini rm">×</button>';
  d.querySelector('.rm').onclick=function(){d.remove();};return d;}
document.getElementById('add-sink').onclick=function(){document.getElementById('sinks').appendChild(sinkRow());};
document.getElementById('sinks').appendChild(sinkRow());
document.getElementById('create').onclick=async function(){
  var name=document.getElementById('t-name').value.trim();document.getElementById('err').textContent='';
  if(!name)return;
  var sinks=[].map.call(document.querySelectorAll('.sink-row'),function(r){return {type:r.querySelector('select').value,target:r.querySelector('input').value.trim()};}).filter(function(s){return s.target;});
  var res=await fetch('/api/topics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:name,sinks:sinks})});
  if(!res.ok){document.getElementById('err').innerHTML='<div class="err">'+esc((await res.json()).error||'erro')+'</div>';return;}
  var t=await res.json();
  alert('Tópico criado.\\nToken (guarde, some depois):\\n'+t.token+'\\n\\nPublicar:\\ncurl -H "Authorization: Bearer '+t.token+'" -d \\'{"title":"oi","message":"teste"}\\' '+location.origin+'/pub/'+t.name);
  document.getElementById('t-name').value='';load();
};
async function load(){
  var d=await (await fetch('/api/topics')).json();
  document.getElementById('list').innerHTML=d.topics.map(function(t){
    var sinks=t.sinks.map(function(s){var c=s.type==='telegram'?'tg':s.type==='discord'?'dc':'wh';return '<span class="pill '+c+'">'+s.type+'</span>';}).join('');
    var last=t.recent[0];
    return '<div class="topic"><div style="display:flex;justify-content:space-between;align-items:center">'+
      '<b>'+esc(t.name)+'</b><button class="mini" data-del="'+esc(t.name)+'">remover</button></div>'+
      '<div style="margin:6px 0">'+sinks+'</div>'+
      '<div class="muted">POST <code>'+location.origin+'/pub/'+esc(t.name)+'</code> · token '+esc(t.token)+'</div>'+
      (last?'<div style="margin-top:6px" class="'+(last.results.every(function(r){return r.ok;})?'ok':'err')+'">último: '+esc(last.title||last.message)+' ('+last.results.filter(function(r){return r.ok;}).length+'/'+last.results.length+' ok)</div>':'')+
      '</div>';
  }).join('')||'<div class="muted">Nenhum tópico.</div>';
  document.querySelectorAll('[data-del]').forEach(function(b){b.onclick=async function(){await fetch('/api/topics/'+b.dataset.del,{method:'DELETE'});load();};});
}
load();setInterval(load,8000);
</script></body></html>`;
