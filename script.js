const bg = document.getElementById("bg");
const ctxBg = bg.getContext("2d");
bg.width = innerWidth;
bg.height = innerHeight;

let stars = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random() * bg.width,
    y: Math.random() * bg.height,
    r: Math.random() * 1.5,
    s: 0.2 + Math.random() * 0.8
  });
}
function drawStars() {
  ctxBg.clearRect(0, 0, bg.width, bg.height);
  ctxBg.fillStyle = "#fff";
  stars.forEach(star => {
    ctxBg.globalAlpha = star.s;
    ctxBg.beginPath();
    ctxBg.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctxBg.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// Coin canvas setup
const canvas = document.getElementById("coinCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

class Coin {
  constructor(img, x, y, speed) {
    this.img = new Image();
    this.img.src = img;
    this.x = x;
    this.y = y;
    this.speed = speed;
  }
  draw() {
    ctx.drawImage(this.img, this.x, this.y, 25, 25);
  }
  update() {
    this.y += this.speed;
    if (this.y > canvas.height) this.y = -25;
    this.draw();
  }
}

const coins = [];
const totalCoins = 100;
const tokenSVGs = [
  "https://cryptologos.cc/logos/solana-sol-logo.svg?v=025",
  "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025",
  "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025",
  "https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=025",
  "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=025"
];
for (let i = 0; i < totalCoins; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const speed = 0.5 + Math.random() * 1.5;
  const img = tokenSVGs[Math.floor(Math.random() * tokenSVGs.length)];
  coins.push(new Coin(img, x, y, speed));
}

function animateCoins() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  coins.forEach((c) => c.update());
  requestAnimationFrame(animateCoins);
}
animateCoins();

// DON'T CLICK EFFECT
const button = document.getElementById("dontClick");
const tooLate = document.getElementById("tooLate");
let crashActive = false;

button.addEventListener("click", () => {
  if (crashActive) return;
  crashActive = true;
  const chart = document.createElement("div");
  chart.id = "chart";
  document.body.appendChild(chart);
  chart.style.position = "absolute";
  chart.style.bottom = "0";
  chart.style.left = "0";
  chart.style.width = "0";
  chart.style.height = "3px";
  chart.style.background = "lime";
  chart.style.boxShadow = "0 0 20px lime";

  let width = 0;
  const grow = setInterval(() => {
    width += 5;
    chart.style.width = width + "px";
    if (width > innerWidth / 2) {
      chart.style.background = "red";
      chart.style.boxShadow = "0 0 30px red";
      clearInterval(grow);
      setTimeout(() => {
        crash();
      }, 1000);
    }
  }, 30);
});

function crash() {
  document.body.classList.add("shake");
  const audio = new Audio("https://cdn.pixabay.com/audio/2021/09/27/audio_5a4f8ab8e7.mp3");
  audio.play();

  tooLate.style.display = "block";
  setTimeout(() => {
    tooLate.style.display = "none";
    document.body.classList.remove("shake");
    document.getElementById("chart").remove();
    crashActive = false;
  }, 5000);
}
