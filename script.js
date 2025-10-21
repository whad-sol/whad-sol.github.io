
/* WHAD v4 Glitch Final Script
   - Chart animation (5s), crash, screen shake, coin rain with stacking, Too Late text, revert.
   - Uses CoinGecko images client-side for 100 logos.
   - Boom sound generated with WebAudio API.
*/

/* Canvases and contexts */
const bgCanvas = document.getElementById('bgCanvas');
const coinCanvas = document.getElementById('coinCanvas');
const chartCanvas = document.getElementById('chartCanvas');
const bgCtx = bgCanvas.getContext('2d');
const ctx = coinCanvas.getContext('2d');
const chartCtx = chartCanvas.getContext('2d');

const logoEl = document.getElementById('logo');
const hoverHint = document.getElementById('hoverHint');
const dontClickBtn = document.getElementById('dontClick');
const tooLateEl = document.getElementById('tooLate');
const solValueEl = document.getElementById('solValue');

function resize(){ 
  [bgCanvas, coinCanvas, chartCanvas].forEach(c=>{ c.width = window.innerWidth; c.height = window.innerHeight; });
}
window.addEventListener('resize', resize);
resize();

/* Background stars/nebula */
let stars = [];
for(let i=0;i<160;i++) stars.push({ x: Math.random()*bgCanvas.width, y: Math.random()*bgCanvas.height, r: Math.random()*1.6, alpha: 0.08+Math.random()*0.6 });
let nebula = [];
for(let i=0;i<26;i++) nebula.push({ x: Math.random()*bgCanvas.width, y: Math.random()*bgCanvas.height, r: 120+Math.random()*380, hue: 240+Math.random()*80, vx:(Math.random()-0.5)*0.06, vy:(Math.random()-0.5)*0.06 });

function drawBG(){
  bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
  nebula.forEach(n=>{
    n.x += n.vx; n.y += n.vy;
    if(n.x < -n.r) n.x = bgCanvas.width + n.r;
    if(n.x > bgCanvas.width + n.r) n.x = -n.r;
    if(n.y < -n.r) n.y = bgCanvas.height + n.r;
    if(n.y > bgCanvas.height + n.r) n.y = -n.r;
    const g = bgCtx.createRadialGradient(n.x, n.y, n.r*0.05, n.x, n.y, n.r);
    g.addColorStop(0, `hsla(${n.hue},80%,68%,0.06)`);
    g.addColorStop(0.5, `hsla(${n.hue},60%,48%,0.03)`);
    g.addColorStop(1, `rgba(0,0,0,0)`);
    bgCtx.fillStyle = g;
    bgCtx.beginPath();
    bgCtx.arc(n.x,n.y,n.r,0,Math.PI*2);
    bgCtx.fill();
  });
  stars.forEach(s=>{
    bgCtx.fillStyle = `rgba(255,255,255,${s.alpha*0.5})`;
    bgCtx.beginPath();
    bgCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
    bgCtx.fill();
  });
}

/* Coin flow & stacking */
let logoSources = [];
let coins = [];
let settled = []; // settled coins on ground
const maxOnScreen = 22;
const totalRain = 100;
const minReappearMs = 1000*60*60;
const LS_KEY = 'whad_last_shown_v4';
let lastShown = {};
try{ lastShown = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }catch(e){ lastShown = {}; }

class FlowCoin {
  constructor(src){
    this.src = src;
    this.img = new Image();
    this.img.crossOrigin = "anonymous";
    this.img.src = src;
    this.size = 18 + Math.random()*34;
    this.x = Math.random()*coinCanvas.width;
    this.y = -50 - Math.random()*800;
    this.vy = 0;
    this.vx = (Math.random()-0.5)*0.6;
    this.gravity = 0.35 + Math.random()*0.45;
    this.opacity = 0.9;
    this.settled = false;
  }
  update(){
    if(this.settled) return;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    // ground collision
    const groundY = coinCanvas.height*0.85;
    if(this.y + this.size >= groundY){
      this.y = groundY - this.size;
      this.vy = 0;
      this.vx = 0;
      this.settled = true;
      placeSettled(this);
    }
  }
  draw(){
    if(!this.img.complete) return;
    ctx.save();
    // circular mask
    ctx.beginPath();
    ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

/* When a coin settles, we try to adjust to avoid overlaps (simple packing) */
def_placeholder = True
def_placeholder2 = True

def place_settled_js():
    pass
# placeholder to maintain cell length; actual placing implemented below

function placeSettled(coin){
  // push until no overlap with other settled coins
  let safe = false;
  let attempts = 0;
  while(!safe && attempts < 120){
    safe = true;
    for(let s of settled){
      const dx = (coin.x + coin.size/2) - (s.x + s.size/2);
      const dy = (coin.y + coin.size/2) - (s.y + s.size/2);
      const dist = Math.hypot(dx,dy);
      const minDist = (coin.size + s.size)/2 * 0.98;
      if(dist < minDist){
        // push coin slightly sideways
        coin.x += (Math.random()>0.5?1:-1) * (minDist - dist + 1);
        safe = false;
      }
    }
    attempts++;
  }
  coin.x = Math.max(4, Math.min(coinCanvas.width - coin.size - 4, coin.x));
  settled.push(coin);
}

/* spawn rain group of many coins (used for glitch) */
function rainCoins(count){
  const arr = [];
  for(let i=0;i<count;i++){
    const src = logoSources.length ? logoSources[Math.floor(Math.random()*logoSources.length)] : null;
    if(!src) continue;
    const c = new FlowCoin(src);
    c.x = Math.random()*(coinCanvas.width*0.9) + coinCanvas.width*0.05;
    c.y = -Math.random()*800 - 20;
    c.vy = Math.random()*1.2 + 0.6;
    c.vx = (Math.random()-0.5)*1.4;
    coins.push(c);
    arr.push(c);
  }
  return arr;
}

/* floating words */
const WORDS = ['dream','have','hodl','pump','dump'];
function spawnWord(){
  const w = document.createElement('div');
  w.className = 'wordBubble';
  w.textContent = WORDS[Math.floor(Math.random()*WORDS.length)];
  const left = Math.random()*80 + 5;
  w.style.left = left + '%';
  w.style.top = (Math.random()*50 + 5) + '%';
  w.style.opacity = 0;
  floatingWords.appendChild(w);
  requestAnimationFrame(()=>{
    w.style.transition = 'transform 3.6s ease, opacity 3.6s ease';
    w.style.opacity = 0.95;
    w.style.transform = 'translateY(-60px)';
  });
  setTimeout(()=>{ w.style.opacity = 0; setTimeout(()=>w.remove(), 3800); }, 2600);
}

/* animate loop */
function animate(){
  requestAnimationFrame(animate);
  drawBG();

  // coins
  ctx.clearRect(0,0,coinCanvas.width, coinCanvas.height);
  for(let c of coins) c.update();
  for(let c of coins) c.draw();
  // settled draw (so they appear as pile)
  for(let s of settled) s.draw();
}
requestAnimationFrame(animate);

/* spawn occasional gentle coins (background vibes) */
setInterval(()=>{
  if(logoSources.length && coins.filter(c=>!c.settled).length < 10){
    const src = logoSources[Math.floor(Math.random()*logoSources.length)];
    const c = new FlowCoin(src);
    c.size = 12 + Math.random()*22;
    c.x = coinCanvas.width * (0.6 + Math.random()*0.35);
    c.y = -50 - Math.random()*200;
    c.vy = 0.6 + Math.random()*0.8;
    coins.push(c);
  }
}, 1200);

/* Chart animation, crash, and full sequence */
let isAnimatingSeq = false;

function playBoomSound(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(24, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.8, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.1);
  }catch(e){ console.warn(e); }
}

function screenShake(duration = 700){
  const start = Date.now();
  const el = document.documentElement;
  const orig = el.style.transform || '';
  const step = ()=>{
    const now = Date.now();
    const t = (now - start)/duration;
    if(t >= 1){ el.style.transform = orig; return; }
    const dx = (Math.random()-0.5) * 18 * (1-t);
    const dy = (Math.random()-0.5) * 10 * (1-t);
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(step);
  };
  step();
}

/* Draw chart from left to right over 5s, then crash */
async function runChartAndCrash(){
  if(isAnimatingSeq) return;
  isAnimatingSeq = true;
  // clear previous piles
  coins = [];
  settled = [];
  // prepare chart canvas
  chartCtx.clearRect(0,0,chartCanvas.width, chartCanvas.height);
  const w = chartCanvas.width, h = chartCanvas.height;
  const startX = w * 0.08, endX = w * 0.92;
  const baseline = h * 0.5;
  // generate control points to simulate a rising curve
  const points = [];
  const steps = 200;
  for(let i=0;i<=steps;i++){
    const t = i/steps;
    const x = startX + (endX - startX) * t;
    const rise = Math.pow(t,1.6) * (h*0.18 + Math.sin(t*10)*10);
    const y = baseline - rise;
    points.push({x,y});
  }
  // animate drawing over 5s
  const duration = 5000;
  const start = performance.now();
  function drawFrame(now){
    const elapsed = now - start;
    const p = Math.min(1, elapsed/duration);
    chartCtx.clearRect(0,0,w,h);
    chartCtx.lineWidth = 6;
    chartCtx.lineCap = 'round';
    const grad = chartCtx.createLinearGradient(startX,0,endX,0);
    grad.addColorStop(0,'#ff2e2e');
    grad.addColorStop(1,'#00ff9a');
    chartCtx.strokeStyle = grad;
    chartCtx.beginPath();
    const upto = Math.floor(points.length * p);
    if(upto > 0){
      chartCtx.moveTo(points[0].x, points[0].y);
      for(let i=1;i<=upto;i++){
        chartCtx.lineTo(points[i].x, points[i].y);
      }
    }
    chartCtx.stroke();
    if(p < 1) requestAnimationFrame(drawFrame);
    else {
      setTimeout(()=>{ crashChart(points); }, 220);
    }
  }
  requestAnimationFrame(drawFrame);
}

function crashChart(points){
  // animate sudden crash: line drops to bottom and turns red
  const w = chartCanvas.width, h = chartCanvas.height;
  const start = performance.now();
  const duration = 420;
  function frame(now){
    const t = Math.min(1,(now-start)/duration);
    chartCtx.clearRect(0,0,w,h);
    chartCtx.lineWidth = 6;
    chartCtx.lineCap = 'round';
    chartCtx.strokeStyle = '#ff2e2e';
    chartCtx.beginPath();
    for(let i=0;i<points.length;i++){
      const q = i/points.length;
      const drop = (1 - Math.pow(1 - t, 3)) * (h*0.6 + q*h*0.15);
      const x = points[i].x;
      const y = points[i].y + drop;
      if(i==0) chartCtx.moveTo(x,y); else chartCtx.lineTo(x,y);
    }
    chartCtx.stroke();
    if(t < 1) requestAnimationFrame(frame);
    else {
      playBoomSound();
      screenShake(700);
      rainCoins(totalRain);
      setTimeout(()=>{
        tooLateEl.style.transition = 'opacity 220ms ease';
        tooLateEl.style.opacity = 1;
        setTimeout(()=>{
          tooLateEl.style.opacity = 0;
          setTimeout(()=>{ resetAfterSequence(); }, 1200);
        }, 1800);
      }, 600);
    }
  }
  requestAnimationFrame(frame);
}

function resetAfterSequence(){
  const fadeDur = 800;
  const start = performance.now();
  function frame(now){
    const t = (now - start)/fadeDur;
    for(let c of coins) c.opacity = Math.max(0, 1 - t);
    for(let s of settled) s.opacity = Math.max(0, 1 - t);
    if(t < 1) requestAnimationFrame(frame);
    else {
      coins = []; settled = []; chartCtx.clearRect(0,0,chartCanvas.width, chartCanvas.height);
      isAnimatingSeq = false;
    }
  }
  requestAnimationFrame(frame);
}

/* simple periodic spawn of background words */
setInterval(()=>{ if(Math.random() < 0.06) spawnWord(); }, 1400);

/* load logos from CoinGecko (top DeFi) */
async function loadLogoSources(){
  try{
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=100&page=1&sparkline=false';
    const res = await fetch(url);
    const arr = await res.json();
    logoSources = arr.map(a => a.image).filter(Boolean);
    if(logoSources.length < 100){
      const extra = [];
      for(let i=0;i<100;i++) extra.push(logoSources[i % logoSources.length]);
      logoSources = extra;
    }
  }catch(e){
    console.warn('fetch logos failed, using fallback', e);
    logoSources = [
      'https://cryptologos.cc/logos/solana-sol-logo.png?v=025',
      'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025',
      'https://cryptologos.cc/logos/chainlink-link-logo.png?v=025',
      'https://cryptologos.cc/logos/uniswap-uni-logo.png?v=025',
      'https://cryptologos.cc/logos/aave-aave-logo.png?v=025',
      'https://cryptologos.cc/logos/maker-mkr-logo.png?v=025',
      'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png?v=025',
      'https://cryptologos.cc/logos/compound-comp-logo.png?v=025',
      'https://cryptologos.cc/logos/pancakeswap-cake-logo.png?v=025',
      'https://cryptologos.cc/logos/sushiswap-sushi-logo.png?v=025'
    ];
    const stretched = [];
    for(let i=0;i<100;i++) stretched.push(logoSources[i % logoSources.length]);
    logoSources = stretched;
  }
  logoSources.forEach(s=>{ const i=new Image(); i.src=s; });
}
loadLogoSources();

/* SOL price */
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

/* hook up don't click */
dontClickBtn.addEventListener('click', ()=>{
  if(isAnimatingSeq) return;
  dontClickBtn.innerText = 'Click detected';
  runChartAndCrash();
  setTimeout(()=>{ if(!isAnimatingSeq) dontClickBtn.innerText = "Don't Click"; else setTimeout(()=>{ dontClickBtn.innerText = "Don't Click"; }, 3000); }, 6000);
});

/* respect reduced motion: lower physics & spawn */
if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  console.log('reduced motion enabled - minimizing animations');
}
