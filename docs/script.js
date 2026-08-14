var els = document.querySelectorAll('.reveal');
var io = new IntersectionObserver(function(entries){
entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.12});
els.forEach(function(el){ io.observe(el); });

var navLinks = document.querySelectorAll('.navlinks a');
var navSections = Array.prototype.map.call(navLinks, function(a){ return document.querySelector(a.getAttribute('href')); });
var navIo = new IntersectionObserver(function(entries){
entries.forEach(function(e){
if(e.isIntersecting){
var idx = navSections.indexOf(e.target);
navLinks.forEach(function(a){ a.classList.remove('active'); });
if(idx > -1) navLinks[idx].classList.add('active');
}
});
}, {rootMargin:'-45% 0px -45% 0px'});
navSections.forEach(function(s){ if(s) navIo.observe(s); });

var toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', function(){
var current = document.documentElement.getAttribute('data-theme');
var next = current === 'dark' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', next);
localStorage.setItem('vfactor-theme', next);
});

// First-visit intent prompt (local UI only — nothing is sent anywhere)
var VISIT_KEY = 'vfactor_visited';
var modal = document.getElementById('visit-modal');
var modalCard = modal.querySelector('.visit-modal-card');
var lastFocused = null;

function trapFocus(e){
if(e.key === 'Escape'){ closeModal(); return; }
if(e.key !== 'Tab') return;
var focusables = modalCard.querySelectorAll('button');
var first = focusables[0], last = focusables[focusables.length-1];
if(e.shiftKey){
if(document.activeElement === first){ e.preventDefault(); last.focus(); }
} else {
if(document.activeElement === last){ e.preventDefault(); first.focus(); }
}
}

function openModal(){
lastFocused = document.activeElement;
modal.classList.add('open');
document.addEventListener('keydown', trapFocus);
var firstBtn = modalCard.querySelector('button');
if(firstBtn) firstBtn.focus();
}

function closeModal(){
modal.classList.remove('open');
localStorage.setItem(VISIT_KEY, '1');
document.removeEventListener('keydown', trapFocus);
if(lastFocused) lastFocused.focus();
}

if(!localStorage.getItem(VISIT_KEY)){
setTimeout(openModal, 600);
}
document.querySelectorAll('.visit-options button').forEach(function(btn){
btn.addEventListener('click', closeModal);
});
document.getElementById('visit-close').addEventListener('click', closeModal);

// ATS resume checker
var ATS_STOPWORDS = new Set(['the','and','for','with','you','are','this','that','will','have','has','from','your','our','job','role','team','work','able','who','using','into','over','under','years','experience','skills','required','preferred','responsibilities','requirements','about','ability','strong','including']);

var atsLibsPromise = null;
function atsLoadScript(src){
return new Promise(function(resolve, reject){
var s = document.createElement('script');
s.src = src;
s.onload = resolve;
s.onerror = reject;
document.head.appendChild(s);
});
}
function ensureAtsLibs(){
if(!atsLibsPromise){
atsLibsPromise = Promise.all([
atsLoadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'),
atsLoadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js')
]);
}
return atsLibsPromise;
}
var atsFileInput = document.getElementById('ats-file');
if(atsFileInput){
atsFileInput.addEventListener('change', function(){ ensureAtsLibs(); });
}

async function atsExtractText(file){
await ensureAtsLibs();
var ext = file.name.split('.').pop().toLowerCase();
if(ext === 'pdf'){
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var buf = await file.arrayBuffer();
var pdf = await pdfjsLib.getDocument({data:buf}).promise;
var text = '';
for(var i=1;i<=pdf.numPages;i++){
var page = await pdf.getPage(i);
var content = await page.getTextContent();
text += content.items.map(function(it){return it.str;}).join(' ') + '\n';
}
return text;
} else if(ext === 'docx'){
var buf2 = await file.arrayBuffer();
var result = await mammoth.extractRawText({arrayBuffer:buf2});
return result.value;
}
return await file.text();
}

function atsScore(text, jdText){
var lower = text.toLowerCase();
var wordCount = text.trim().split(/\s+/).filter(Boolean).length;
var checks = [];

var hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
var hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
checks.push({label:'Contact info (email + phone) detected', pass: hasEmail && hasPhone, weight:15});

var sections = ['experience','education','skills','summary','projects'];
var found = sections.filter(function(s){ return lower.indexOf(s) > -1; });
checks.push({label:'Standard sections found ('+found.length+'/5)', pass: found.length>=3, weight:20});

var goodLength = wordCount>=350 && wordCount<=900;
checks.push({label:'Resume length ('+wordCount+' words)', pass: goodLength, weight:15});

var bulletCount = (text.match(/[•\-\*]\s/g)||[]).length;
checks.push({label:'Bullet points used ('+bulletCount+')', pass: bulletCount>=5, weight:10});

var verbs = ['led','managed','built','developed','designed','implemented','improved','created','launched','automated','optimized','reduced','increased','delivered'];
var verbHits = verbs.filter(function(v){ return lower.indexOf(v) > -1; }).length;
checks.push({label:'Action verbs used ('+verbHits+'/'+verbs.length+')', pass: verbHits>=5, weight:15});

if(jdText && jdText.trim().length>20){
var jdWords = Array.from(new Set((jdText.toLowerCase().match(/[a-z][a-z+.#]{2,}/g)||[])))
.filter(function(w){ return !ATS_STOPWORDS.has(w); });
var matched = jdWords.filter(function(w){ return lower.indexOf(w) > -1; });
var pct = jdWords.length ? Math.round(matched.length/jdWords.length*100) : 0;
checks.push({label:'Keyword match vs job description ('+pct+'%)', pass: pct>=50, weight:25});
} else {
checks.push({label:'No job description provided — add one for keyword matching', pass:false, weight:0});
}

var totalWeight = checks.reduce(function(a,c){ return a+c.weight; },0) || 1;
var score = Math.round(checks.reduce(function(a,c){ return a + (c.pass? c.weight:0); },0) / totalWeight * 100);
return {score:score, checks:checks};
}

var atsRunBtn = document.getElementById('ats-run');
if(atsRunBtn){
atsRunBtn.addEventListener('click', async function(){
var fileInput = document.getElementById('ats-file');
var jd = document.getElementById('ats-jd').value;
var out = document.getElementById('ats-result');
if(!fileInput.files.length){ out.innerHTML = '<p style="color:var(--signal);">Upload a resume file first.</p>'; return; }
out.innerHTML = '<p style="color:var(--ink-soft);">Analyzing…</p>';
try{
var text = await atsExtractText(fileInput.files[0]);
var result = atsScore(text, jd);
var color = result.score>=75 ? 'var(--field)' : result.score>=50 ? 'var(--star)' : 'var(--signal)';
var html = '<div class="ats-score" style="color:'+color+';">'+result.score+'<span style="font-size:18px;color:var(--ink-soft);">/100</span></div>';
html += '<ul class="ats-check-list">';
result.checks.forEach(function(c){
var icon = c.pass ? '✓' : '✕';
var col = c.pass ? 'var(--field-deep)' : 'var(--signal)';
html += '<li><span class="mark" style="color:'+col+';">'+icon+'</span> '+c.label+'</li>';
});
html += '</ul>';
html += '<button class="btn btn-ghost" id="ats-send" type="button" style="margin-top:18px;">Email this resume for open roles</button>';
html += '<p class="ats-note">Opens your mail app — attach your resume file before sending.</p>';
out.innerHTML = html;
var sendBtn = document.getElementById('ats-send');
if(sendBtn){
sendBtn.addEventListener('click', function(){
var subject = encodeURIComponent('Resume for open roles — ATS score '+result.score);
var body = encodeURIComponent('Hi vFactor team,\n\nPlease find my resume attached for consideration against any open roles.\n\n(Self-check ATS score: '+result.score+'/100)');
window.location.href = 'mailto:cpvijay25@gmail.com?subject='+subject+'&body='+body;
});
}
} catch(err){
out.innerHTML = '<p style="color:var(--signal);">Could not read that file. Try a PDF, DOCX or TXT.</p>';
}
});
}
