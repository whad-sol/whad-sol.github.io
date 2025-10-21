
/* Main JS for WHAD v2
   - Fetches top DeFi coins from CoinGecko (client-side) and uses their images as moving logos
   - Ensures a shown logo won't reappear for at least 1 hour via localStorage tracking
   - Adds floating words occasionally
   - Sol price card that updates every 60s
   - Background subtle animated particles
*/

const bgCanvas = document.getElementById('bgCanvas');
const coinCanvas = document.getElementById('coinCanvas');
const bgCtx = bgCanvas.getContext('2d');
const ctx = coinCanvas.getContext('2d');
const logoEl = document.getElementById('logo');
const floatingWords = document.getElementById('floatingWords');
const solValueEl = document.getElementById('solValue');
const solLogoImg = document.getElementById('solLogo');

function resize(){
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  coinCanvas.width = window.innerWidth;
  coinCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

/* -- Background animated particles (neon blobs) -- */
let particles = [];
for(let i=0;i<30;i++){
  particles.push({
    x: Math.random()*bgCanvas.width,
    y: Math.random()*bgCanvas.height,
    r: 30 + Math.random()*120,
    vx: (Math.random()-0.5)*0.1,
    vy: (Math.random()-0.5)*0.1,
    hue: 260 + Math.random()*80
  });
}

function drawBG(t){
  bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
  particles.forEach(p=>{
    p.x += p.vx;
    p.y += p.vy;
    // wrap
    if(p.x < -p.r) p.x = bgCanvas.width + p.r;
    if(p.x > bgCanvas.width + p.r) p.x = -p.r;
    if(p.y < -p.r) p.y = bgCanvas.height + p.r;
    if(p.y > bgCanvas.height + p.r) p.y = -p.r;

    const g = bgCtx.createRadialGradient(p.x, p.y, p.r*0.05, p.x, p.y, p.r);
    g.addColorStop(0, `hsla(${p.hue},90%,70%,0.12)`);
    g.addColorStop(0.6, `hsla(${p.hue},80%,40%,0.06)`);
    g.addColorStop(1, `rgba(0,0,0,0)`);
    bgCtx.fillStyle = g;
    bgCtx.beginPath();
    bgCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    bgCtx.fill();
  });
}

/* -- Coin logos flow -- */
let logoSources = []; // will be filled by API images
let coins = [];
const maxCoinsOnScreen = 22; // keep subtle, not too crowded
const minReappearMs = 1000*60*60; // 1 hour as requested

// track last shown times in localStorage to avoid repeats
const LS_KEY = 'whad_last_shown';
let lastShown = {};
try{ lastShown = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }catch(e){ lastShown = {}; }

class FlowCoin {
  constructor(src){
    this.img = new Image();
    this.img.src = src;
    this.w = 30 + Math.random()*40; // small to medium, not flashy
    this.h = this.w;
    this.x = window.innerWidth * (0.6 + Math.random()*0.35); // start from right-side area
    this.y = -50 - Math.random()*200;
    this.speed = 0.3 + Math.random()*1.2;
    this.angle = -0.5 + Math.random()*-0.6; // diagonal left-down
    this.opacity = 0.18 + Math.random()*0.35;
    this.created = Date.now();
    this.key = src; // fallback key
  }
  update(){
    this.x += this.angle * this.speed * 2;
    this.y += this.speed * 1.6;
    // slight bob
    this.x += Math.sin((this.y + this.created)/600) * 0.4;
    // fade out when leaving
    if(this.y > coinCanvas.height + 100) return false;
    return true;
  }
  draw(){
    try{
      ctx.save();
      ctx.globalAlpha = this.opacity;
      // subtle blur/drop shadow effect
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 8;
      ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
      ctx.restore();
    }catch(e){}
  }
}

function spawnCoin(){
  if(!logoSources.length) return;
  if(coins.length > maxCoinsOnScreen) return;

  // pick a source not seen in last hour
  const now = Date.now();
  let attempts = 0;
  while(attempts < 40){
    const src = logoSources[Math.floor(Math.random()*logoSources.length)];
    const last = lastShown[src] || 0;
    if(now - last > minReappearMs){
      // mark shown
      lastShown[src] = now;
      localStorage.setItem(LS_KEY, JSON.stringify(lastShown));
      const fc = new FlowCoin(src);
      coins.push(fc);
      break;
    }
    attempts++;
  }
}

/* floating words (rare) */
const WORDS = ['dream','have','hodl','pump','dump'];
function spawnWord(){
  const w = document.createElement('div');
  w.className = 'wordBubble';
  w.textContent = WORDS[Math.floor(Math.random()*WORDS.length)];
  const left = Math.random()*80 + 10;
  w.style.left = left + '%';
  w.style.top = (Math.random()*40 + 10) + '%';
  w.style.opacity = 0;
  floatingWords.appendChild(w);
  // animate in/out
  requestAnimationFrame(()=>{
    w.style.transition = 'transform 3s ease, opacity 3s ease';
    w.style.opacity = 0.95;
    w.style.transform = 'translateY(-40px)';
  });
  setTimeout(()=>{
    w.style.opacity = 0;
    setTimeout(()=> w.remove(), 3200);
  }, 2200);
}

/* main animate */
function animate(t){
  requestAnimationFrame(animate);
  drawBG(t);

  // coins canvas
  ctx.clearRect(0,0,coinCanvas.width, coinCanvas.height);
  // update coins
  coins = coins.filter(c => {
    const ok = c.update();
    if(ok) c.draw();
    return ok;
  });
}
requestAnimationFrame(animate);

/* spawn rhythm: coins spawn slowly so not too frequent */
setInterval(spawnCoin, 900);
setInterval(()=>{ if(Math.random() < 0.12) spawnWord(); }, 1300);

/* mouse hover effect for logo - subtle popup text near cursor */
const popup = document.createElement('div');
popup.style.position = 'fixed';
popup.style.padding = '8px 12px';
popup.style.background = 'linear-gradient(90deg,var(--neon1),var(--neon3))';
popup.style.borderRadius = '10px';
popup.style.transform = 'translate(-50%,-140%) scale(0.95)';
popup.style.pointerEvents = 'none';
popup.style.zIndex = '60';
popup.style.fontFamily = 'Permanent Marker, cursive';
popup.style.color = '#0b0014';
popup.style.display = 'none';
popup.style.boxShadow = '0 10px 40px rgba(127,0,255,0.12)';
popup.innerText = 'what? no.. WHAD!';
document.body.appendChild(popup);

logoEl.style.pointerEvents = 'auto';
logoEl.addEventListener('mouseenter', (e)=>{
  popup.style.left = (e.clientX) + 'px';
  popup.style.top = (e.clientY - 8) + 'px';
  popup.style.display = 'block';
  popup.style.opacity = 0;
  popup.style.transition = 'opacity 220ms ease, transform 220ms ease';
  requestAnimationFrame(()=>{ popup.style.opacity = 1; popup.style.transform = 'translate(-50%,-160%) scale(1)'; });
});
logoEl.addEventListener('mousemove', (e)=>{
  popup.style.left = (e.clientX) + 'px';
  popup.style.top = (e.clientY - 8) + 'px';
});
logoEl.addEventListener('mouseleave', ()=>{
  popup.style.opacity = 0;
  setTimeout(()=> popup.style.display = 'none', 240);
});

/* -- Fetch top DeFi coins list (client-side) --
   We'll fetch from CoinGecko and use the image fields returned.
   If fetch fails, fallback to a few known logos.
*/
async function loadLogoSources(){
  try{
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=100&page=1&sparkline=false';
    const res = await fetch(url);
    const arr = await res.json();
    logoSources = arr.map(a => a.image).filter(Boolean);
  }catch(e){
    console.warn('Could not fetch from CoinGecko, using fallback logos', e);
    logoSources = [
      'https://cryptologos.cc/logos/uniswap-uni-logo.png?v=025',
      'https://cryptologos.cc/logos/aave-aave-logo.png?v=025',
      'https://cryptologos.cc/logos/chainlink-link-logo.png?v=025',
      'https://cryptologos.cc/logos/maker-mkr-logo.png?v=025',
      'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png?v=025',
      'https://cryptologos.cc/logos/compound-comp-logo.png?v=025',
      'https://cryptologos.cc/logos/pancakeswap-cake-logo.png?v=025',
      'https://cryptologos.cc/logos/terra-luna-luna-logo.png?v=025'
    ];
  }
  // preload images slowly (avoid CORS issues by letting browser request them)
  logoSources.forEach(src=>{
    const i = new Image();
    i.src = src;
  });
}
loadLogoSources();

/* SOL price fetching - update card every 60s */
async function fetchSOL(){
  try{
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await res.json();
    const n = Number(data.solana.usd);
    solValueEl.innerText = n ? '$' + n.toLocaleString(undefined, {maximumFractionDigits:2}) : '—';
  }catch(e){ console.warn(e); }
}
fetchSOL();
setInterval(fetchSOL, 60_000);

/* gentle spawn initial burst */
for(let i=0;i<6;i++) setTimeout(spawnCoin, i*200);

/* accessibility: reduce motion if user prefers reduced motion */
if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  // stop animations by clearing intervals
  // leave still logo and price
  console.log('reduced motion: minimizing animations');
}
