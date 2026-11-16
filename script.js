const video=document.getElementById('video');
const live=document.getElementById('live');
const lctx=live.getContext('2d');
const flash=document.getElementById('flash');
const countEl=document.getElementById('count');
const strip=document.getElementById('strip');
const faceEl=document.getElementById('faceFilter');
let stream=null, facing='user', tone='none', selected=null, pendingSticker=null;

const FACES={none:'',cat:'🐱‍👤\n˶•ᵕ•˶',bow:'🎀',blush:'૮₍ ˶•⤙•˶ ₎ა + ♥♥',star:'✧˖° ⭐ °˖✧',bear:'ʕ•ᴥ•ʔ ♡'};
const TONES={none:'none',pink:'saturate(1.4) sepia(.25) hue-rotate(-15deg)',milk:'brightness(1.15) contrast(.9) saturate(1.1)',retro:'sepia(.6) contrast(1.1) brightness(.95)',cold:'saturate(1.2) hue-rotate(15deg) brightness(1.05)',bw:'grayscale(1) contrast(1.1)'};

// เปิดตู้ + เปิดกล้อง
document.getElementById('openBtn').onclick=async()=>{
  document.querySelector('.curtain').classList.add('open');
  await startCam();
  tick();
};
async function startCam(){
  if(stream) stream.getTracks().forEach(t=>t.stop());
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false});
  video.srcObject=stream;
}
document.getElementById('switchBtn').onclick=()=>{facing=facing==='user'?'environment':'user';startCam();};

// เลือกโทน + หน้า
document.getElementById('toneRow').onclick=e=>{if(e.target.dataset.tone){tone=e.target.dataset.tone;[...e.currentTarget.children].forEach(b=>b.classList.toggle('active',b===e.target));}};
document.getElementById('faceRow').onclick=e=>{if(e.target.dataset.face){faceEl.textContent=FACES[e.target.dataset.face];[...e.currentTarget.children].forEach(b=>b.classList.toggle('active',b===e.target));}};

// ลูปฟิลเตอร์สดลง canvas ทับ video
function tick(){
  if(video.videoWidth){live.width=video.videoWidth;live.height=video.videoHeight;lctx.filter=TONES[tone]||'none';lctx.drawImage(video,0,0);}
  requestAnimationFrame(tick);
}
// นาฬิกา
let s=0;setInterval(()=>{s++;document.getElementById('clock').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},1000);

// ถ่าย!
document.getElementById('shotBtn').onclick=()=>{
  let n=3;countEl.textContent=n;
  const iv=setInterval(()=>{
    n--;countEl.textContent=n>0?n:'';
    if(n<=0){clearInterval(iv);doShot();}
  },600);
};
function doShot(){
  flash.classList.remove('go');void flash.offsetWidth;flash.classList.add('go');
  const c=document.createElement('canvas');c.width=video.videoWidth||640;c.height=video.videoHeight||800;
  const x=c.getContext('2d');x.filter=TONES[tone]||'none';x.translate(c.width,0);x.scale(-1,1);x.drawImage(video,0,0,c.width,c.height);
  // วาดฟิลเตอร์หน้าลงรูป (แบบง่ายกลางรูปบน)
  x.filter='none';x.font=`${c.width*0.12}px serif`;x.textAlign='center';
  x.fillText(faceEl.textContent.split('\n')[0]||'',c.width/2,c.height*0.22);
  const url=c.toDataURL('image/png');
  const d=document.createElement('div');d.className='pola frame-white';
  d.innerHTML=`<img src="${url}"><div style="font-size:12px;text-align:center;margin-top:4px">PURI ♡ ${new Date().toLocaleDateString()}</div>`;
  d.onclick=(e)=>{
    if(pendingSticker){addSticker(d,pendingSticker,e);pendingSticker=null;return;}
    document.querySelectorAll('.pola').forEach(p=>p.classList.remove('selected'));d.classList.add('selected');selected=d;
  };
  strip.prepend(d);d.classList.add('selected');selected=d;
}

// กรอบ
document.getElementById('frameRow').onclick=e=>{
  const f=e.target.dataset.frame;if(!f||!selected)return;
  selected.className='pola selected frame-'+f;
};

// แปะสติกเกอร์
document.getElementById('stickerTray').onclick=e=>{
  if(e.target.tagName==='BUTTON'){pendingSticker=e.target.textContent;alert('แตะบนรูปโพลารอยด์เพื่อแปะ '+pendingSticker);}
};
function addSticker(pola,emoji,ev){
  const s=document.createElement('span');s.className='stk';s.textContent=emoji;
  s.style.left='30%';s.style.top='30%';pola.appendChild(s);
  let dx,dy,drag=false;
  s.onpointerdown=e=>{drag=true;dx=e.offsetX;dy=e.offsetY;s.setPointerCapture(e.pointerId)};
  s.onpointermove=e=>{if(!drag)return;const r=pola.getBoundingClientRect();s.style.left=(e.clientX-r.left-10)+'px';s.style.top=(e.clientY-r.top-10)+'px'};
  s.onpointerup=()=>drag=false;
  s.ondblclick=()=>s.remove();
}

// เซฟ + ปริ้นท์
document.getElementById('saveBtn').onclick=async()=>{
  if(!selected)return alert('ถ่ายก่อน 1 ใบนะ');
  const {default:html2canvas}=await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm').catch(()=>({default:null}));
  if(html2canvas){const cv=await html2canvas(selected);const a=document.createElement('a');a.download='puri-polaroid.png';a.href=cv.toDataURL();a.click();}
  else{const img=selected.querySelector('img');const a=document.createElement('a');a.download='puri.png';a.href=img.src;a.click();}
};
document.getElementById('printBtn').onclick=()=>window.print();

// วิ้งค์ลากตามนิ้ว
const sp=document.getElementById('sparkle'),sx=sp.getContext('2d');let pts=[];
function rs(){sp.width=innerWidth;sp.height=innerHeight}rs();addEventListener('resize',rs);
addEventListener('pointermove',e=>{for(let i=0;i<3;i++)pts.push({x:e.clientX,y:e.clientY,vx:(Math.random()-.5)*2,vy:Math.random()*-2-1,l:1});});
(function loop(){sx.clearRect(0,0,sp.width,sp.height);pts=pts.filter(p=>p.l>0);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.l-=.02;sx.fillStyle=`rgba(255,80,150,${p.l})`;sx.fillText('✧',p.x,p.y)});sx.font='14px serif';requestAnimationFrame(loop)})();
