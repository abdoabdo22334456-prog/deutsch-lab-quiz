'use strict';
document.getElementById("app").innerHTML = "<svg aria-hidden=\"true\" style=\"display:none\"><symbol id=\"speaker\" viewBox=\"0 0 24 24\"><path d=\"M11 5 6 9H3v6h3l5 4V5Z\"/><path d=\"M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14\"/></symbol></svg>\n<header class=\"topbar\">\n <div class=\"brand\"><span class=\"brand-mark\" dir=\"ltr\">DE.</span><div><div class=\"brand-name\" dir=\"ltr\">Deutsch Lab</div><div class=\"brand-caption\">ألماني الكمبيوتر · تدريب بالفهم</div></div></div>\n <span class=\"top-status\"><span class=\"status-dot\"></span>نطق ألماني · تسجيلات كاملة</span>\n</header>\n<main class=\"layout\">\n <aside class=\"side\">\n  <span class=\"eyebrow\">خطوة بخطوة</span><h1>افهم الشاشة.<br>واختار بثقة.</h1><p class=\"side-intro\">٢٥٠ سؤالًا، في الاتجاهين.<br>كل إجابة صح خطوة لقدّام.</p>\n  <div class=\"stats\"><div><span id=\"mastered\" class=\"stat-number\">٠</span><span class=\"stat-label\">اتحلّوا صح</span></div><div><span id=\"remaining\" class=\"stat-number\">٢٥٠</span><span class=\"stat-label\">متبقي</span></div></div>\n  <div id=\"progress\" class=\"track\" role=\"progressbar\" aria-label=\"تقدمك\" aria-valuemin=\"0\" aria-valuemax=\"250\" aria-valuenow=\"0\"><span id=\"progress-fill\" style=\"width:0%\"></span></div>\n  <section class=\"side-section\"><h2>اتجاه التدريب</h2><div class=\"mode-list\">\n   <button class=\"mode-btn\" data-mode=\"mixed\" aria-pressed=\"true\"><span>بالتبادل</span><span dir=\"ltr\">DE ⇄ AR</span></button>\n   <button class=\"mode-btn\" data-mode=\"de\" aria-pressed=\"false\"><span>ألماني ← عربي</span><span dir=\"ltr\">DE → AR</span></button>\n   <button class=\"mode-btn\" data-mode=\"ar\" aria-pressed=\"false\"><span>عربي ← ألماني</span><span dir=\"ltr\">AR → DE</span></button>\n  </div></section>\n  <section class=\"side-section\"><div class=\"audio-settings\"><label for=\"speed\">سرعة النطق الألماني</label><select id=\"speed\"><option value=\"0.75\">هادئ · 0.75×</option><option value=\"0.9\" selected>واضح · 0.9×</option><option value=\"1\">طبيعي · 1×</option><option value=\"1.15\">سريع · 1.15×</option></select></div><p class=\"side-note\">نطق ألماني كامل، جاهز داخل المشروع.</p></section>\n </aside>\n <section class=\"lesson\" aria-label=\"التمرين\">\n  <div id=\"migration\" class=\"notice\" hidden></div>\n  <div id=\"quiz\">\n   <div class=\"lesson-head\"><div class=\"tags\"><span id=\"direction\" class=\"tag direction\" dir=\"ltr\">DE → AR</span><span id=\"topic\" class=\"tag\"></span><span id=\"kind\" class=\"tag\"></span></div><span id=\"counter\" class=\"q-counter\"></span></div>\n   <h2 id=\"question\" class=\"question\"></h2>\n   <div class=\"question-tools\"><button id=\"speak-question\" class=\"listen-main\"><svg aria-hidden=\"true\"><use href=\"#speaker\"/></svg>اسمع السؤال</button><button id=\"stop-audio\" class=\"stop\" hidden>إيقاف الصوت</button><span id=\"audio-status\" class=\"audio-status\" aria-live=\"polite\"></span></div>\n   <fieldset><legend class=\"sr-only\">اختار إجابة واحدة</legend><div id=\"options\" class=\"choice-list\"></div></fieldset>\n   <div id=\"feedback\" class=\"feedback\" aria-live=\"polite\" hidden><div id=\"result\" class=\"feedback-title\"></div><p id=\"explanation\"></p><div class=\"feedback-footer\"><span id=\"source\"></span><button id=\"speak-answer\" class=\"answer-audio\"><svg aria-hidden=\"true\"><use href=\"#speaker\"/></svg>اسمع الإجابة الصحيحة</button></div></div>\n   <div class=\"actions\"><span class=\"keys\">اختار 1–4 · تأكيد Enter</span><button id=\"check\" class=\"primary\" disabled>تأكيد الإجابة</button><button id=\"next\" class=\"primary\" hidden>السؤال اللي بعده ←</button></div>\n  </div>\n  <div id=\"complete\" class=\"complete\" hidden><div class=\"complete-icon\">✓</div><h2>خلصت كل الأسئلة!</h2><p>الأسئلة اللي اتحلّت صح مش هتظهر تاني.</p></div>\n  <div class=\"bottom-line\"><span id=\"save-status\">تقدمك بيتحفظ على نفس المتصفح</span><span>الصح يتشال · الغلط يرجع للمراجعة</span></div>\n </section>\n</main>\n<audio id=\"player\" preload=\"none\"></audio>";

'use strict';
const BANK=window.DEUTSCH_LAB_DATA.bank;
const AUDIO=window.DEUTSCH_LAB_DATA.audio;
const LEGACY_MAP=window.DEUTSCH_LAB_DATA.legacyMap;
const STORE='deutsch-lab-v2-progress';
const $=id=>document.getElementById(id);
const number=new Intl.NumberFormat('ar-EG');
const byId=new Map(BANK.map(q=>[q.id,q]));
const shuffle=list=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
let migrated=0;
function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(STORE)||'null');
  if(raw&&raw.version===2&&Array.isArray(raw.mastered)&&Array.isArray(raw.queue)){
   const mastered=[...new Set(raw.mastered.filter(x=>byId.has(x)))];const exclude=new Set(mastered);
   const queue=[...new Set(raw.queue.filter(x=>byId.has(x)&&!exclude.has(x)))];
   const queued=new Set(queue);BANK.forEach(q=>{if(!exclude.has(q.id)&&!queued.has(q.id))queue.push(q.id);});
   return {version:2,mastered,queue,attempts:Number.isSafeInteger(raw.attempts)?raw.attempts:mastered.length,incorrect:Number.isSafeInteger(raw.incorrect)?raw.incorrect:0,nextLang:raw.nextLang==='ar'?'ar':'de',mode:['mixed','de','ar'].includes(raw.mode)?raw.mode:'mixed',speed:[.75,.9,1,1.15].includes(Number(raw.speed))?Number(raw.speed):.9};
  }
  const key='codex:visualization-widget-state-v2:'+JSON.stringify([location.pathname,location.search]);
  const old=JSON.parse(localStorage.getItem(key)||'null')?.privateContent;
  if(old?.bankKey==='german-computer-arabic-v1-125'&&Array.isArray(old.mastered)){
   const mastered=[...new Set(old.mastered.map(id=>LEGACY_MAP[id]).filter(id=>byId.has(id)))];migrated=mastered.length;
   return {version:2,mastered,queue:shuffle(BANK.filter(q=>!mastered.includes(q.id)).map(q=>q.id)),attempts:old.attempts||mastered.length,incorrect:old.incorrect||0,nextLang:'de',mode:'mixed',speed:.9};
  }
 }catch{}
 return {version:2,mastered:[],queue:[1,...shuffle(BANK.slice(1).map(q=>q.id))],attempts:0,incorrect:0,nextLang:'de',mode:'mixed',speed:.9};
}
let state=load();let current=null;let selected=null;let answered=false;let lastConcept=null;let displayOrder=[];
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));$('save-status').textContent='✓ تقدمك محفوظ';}catch{$('save-status').textContent='الحفظ غير متاح؛ تقدمك موجود أثناء فتح الصفحة.';}}
function pick(){const target=state.mode==='mixed'?state.nextLang:state.mode;const pending=state.queue.map(id=>byId.get(id));const relevant=pending.filter(q=>q.lang===target);return relevant.find(q=>q.concept!==lastConcept)||relevant[0]||(state.mode==='mixed'?pending[0]:null);}
function progress(){const n=state.mastered.length;$('mastered').textContent=number.format(n);$('remaining').textContent=number.format(state.queue.length);$('progress').setAttribute('aria-valuenow',n);$('progress-fill').style.width=(n/250*100)+'%';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===state.mode));$('speed').value=String(state.speed);}
const player=$('player');let playRun=0;
player.preservesPitch=true;
function stop(){++playRun;player.pause();$('stop-audio').hidden=true;$('audio-status').textContent='';document.querySelectorAll('.playing').forEach(b=>b.classList.remove('playing'));}
function finish(){stop();$('audio-status').textContent='انتهى النطق';}
function assetUrl(index){return new URL(AUDIO.assets[index],document.baseURI).href;}
async function speak(text,lang,button){if(lang!=='de')return;stop();const run=playRun;const entry=AUDIO.clips['de|'+text];if(!entry){$('audio-status').textContent='الصوت الخاص بالنص ده غير متاح.';return;}
 $('audio-status').textContent='جاري التشغيل…';$('stop-audio').hidden=false;if(button)button.classList.add('playing');
 try{player.src=assetUrl(entry.asset);player.playbackRate=state.speed;await player.play();if(run!==playRun)return;$('audio-status').textContent='بيتشغّل';
 }catch{if(run===playRun){$('audio-status').textContent='المتصفح منع التشغيل؛ اضغط اسمع مرة تانية.';$('stop-audio').hidden=true;}}
}
player.addEventListener('ended',()=>{if(player.ended)finish();});
$('stop-audio').onclick=stop;$('speak-question').onclick=()=>{if(current)speak(current.prompt,current.lang,$('speak-question'));};$('speak-answer').onclick=()=>{if(current)speak(current.options[0],current.answerLang,$('speak-answer'));};
$('speed').onchange=()=>{state.speed=Number($('speed').value);player.playbackRate=state.speed;save();};
function render(){stop();progress();current=pick();selected=null;answered=false;$('feedback').hidden=true;$('next').hidden=true;$('check').hidden=false;$('check').disabled=true;$('quiz').hidden=!current;$('complete').hidden=!!current;
 if(!current){const all=state.queue.length===0;$('complete').querySelector('h2').textContent=all?'خلصت كل الأسئلة!':'خلصت الاتجاه ده!';$('complete').querySelector('p').textContent=all?'كل الأسئلة اتحلّت صح ومش هتتكرر.':'اختار الاتجاه التاني أو بالتبادل عشان تكمل باقي الأسئلة.';return;}
 $('direction').textContent=current.lang==='de'?'DE → AR':'AR → DE';$('topic').textContent=current.topic;$('kind').textContent=current.kind;$('counter').textContent='محاولة '+number.format(state.attempts+1);
 $('question').textContent=current.prompt;$('question').lang=current.lang;$('question').dir=current.lang==='de'?'ltr':'rtl';$('options').dir=current.answerLang==='de'?'ltr':'rtl';
 $('speak-question').hidden=current.lang!=='de';$('speak-answer').hidden=current.answerLang!=='de';
 displayOrder=shuffle([0,1,2,3]);$('options').replaceChildren();displayOrder.forEach((opt,index)=>{
  const row=document.createElement('div');row.className='choice';row.dataset.option=opt;
  const label=document.createElement('label');const radio=document.createElement('input');radio.type='radio';radio.name='answer';radio.value=opt;radio.id='answer-'+index;
  const letter=document.createElement('span');letter.className='choice-letter';letter.textContent=current.answerLang==='de'?['A','B','C','D'][index]:['١','٢','٣','٤'][index];
  const content=document.createElement('span');content.className='choice-text';content.lang=current.answerLang;content.textContent=current.options[opt];label.append(radio,letter,content);
  row.append(label);
  if(current.answerLang==='de'){
   const audioButton=document.createElement('button');audioButton.className='choice-speak';audioButton.type='button';audioButton.setAttribute('aria-label','اسمع الاختيار '+(index+1));audioButton.innerHTML='<svg aria-hidden="true"><use href="#speaker"/></svg>';
   audioButton.onclick=()=>speak(current.options[opt],'de',audioButton);row.append(audioButton);
  }else row.classList.add('no-audio');
  radio.onchange=()=>{if(!answered){selected=opt;$('check').disabled=false;}};$('options').append(row);
 });
}
function check(){if(selected===null||answered||!current)return;stop();answered=true;const ok=selected===0;state.attempts++;state.queue=state.queue.filter(id=>id!==current.id);if(ok)state.mastered.push(current.id);else{state.queue.push(current.id);state.incorrect++;}state.nextLang=current.lang==='de'?'ar':'de';lastConcept=current.concept;
 document.querySelectorAll('.choice').forEach(row=>{row.classList.add('locked');row.querySelector('input').disabled=true;const opt=Number(row.dataset.option);if(opt===0){row.classList.add('correct');const mark=document.createElement('span');mark.className='result-mark';mark.textContent='✓ صح';row.querySelector('label').append(mark);}else if(opt===selected)row.classList.add('wrong');});
 $('feedback').hidden=false;$('feedback').className='feedback'+(ok?'':' error');$('result').textContent=ok?'صح. السؤال ده اتشال ✓':'مش صح. هنرجع للسؤال ده لاحقًا.';$('explanation').textContent=current.explanation;$('source').textContent='القاموس · صفحة '+number.format(current.page);$('check').hidden=true;$('next').hidden=false;progress();save();
}
$('check').onclick=check;$('next').onclick=()=>{render();$('question').scrollIntoView({block:'nearest',behavior:'smooth'});};
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{state.mode=button.dataset.mode;save();render();});
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)&&e.target.type!=='radio')return;if(e.key==='Enter'&&!e.repeat){e.preventDefault();if(answered)$('next').click();else check();}else if(/^[1-4]$/.test(e.key)&&!answered&&current){const input=$('options').querySelectorAll('input')[Number(e.key)-1];input.checked=true;input.dispatchEvent(new Event('change'));}});
if(migrated){$('migration').hidden=false;$('migration').textContent='احتفظنا بـ'+number.format(migrated)+' سؤال من اللي حلّيتهم صح في النسخة السابقة.';save();}
render();
