import { disableInventory, enableInventory } from "./items.js";
import { notify, playSound } from "./utils.js";

const TAU = Math.PI * 2;

function justWheel(options = [
  {
    display: 'Test', chance: 50, color: '#6b1c1c',
    function: () => { document.body.style.background = '#6b1c1c' }
  },
  {
    display: 'Test 2', chance: 30, color: '#1c2f6b',
    function: () => { document.body.style.background = '#1c2f6b' }
  },
  {
    display: '10 tons of rich uranium', chance: 4,
    function: () => { document.body.style.background = '#04ff00' }
  },
], duration = 5000) {
  let total = 0
  options.forEach(option => total += option.chance);

  let roll = Math.random() * total;
  let winner = options[options.length - 1];
  for (const option of options) {
    if ((roll -= option.chance) < 0) {
      winner = option
      break
    }
  }

  let acc = 0
  const slices = options.map((option, index) => {
    const size = (option.chance / total) * TAU
    const slice = {
      option: option,
      start: acc,
      size: size,
      color: option.color || `hsl(${(index * 135) % 360} 70% 50%)`
    }
    acc += size
    return slice
  })
  const winSlice = slices.find(slice => slice.option === winner)

  const overlay = document.createElement('div')
  overlay.className = 'sw-overlay'
  overlay.innerHTML = `
      <div class="sw-box">
        <div class="sw-wheel-wrap">
          <canvas></canvas>
          <div class="sw-pointer"></div>
        </div>
      </div>`
  document.body.appendChild(overlay)

  const canvas = overlay.querySelector('canvas')
  const size = Math.min(480, Math.floor(Math.min(innerWidth, innerHeight) * 0.75))
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.height = size * dpr
  canvas.style.width = canvas.style.height = size + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr) // need this or it will be blurry

  const c = size / 2, R = c - 4

  function draw(rot) {
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(rot)
    for (const slice of slices) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R, slice.start, slice.start + slice.size)
      ctx.closePath()
      ctx.fillStyle = slice.color;
      ctx.fill()
      ctx.strokeStyle = 'transparent'
      ctx.stroke()

      // label
      ctx.save()
      ctx.rotate(slice.start + slice.size / 2)
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      const fontSize = Math.max(10, Math.min(24, R * slice.size * 0.45))
      ctx.font = `400 ${fontSize}px "Montserrat", sans-serif`
      let text = String(slice.option.display)
      const maxWidth = R * 0.63
      while (text.length > 1 && ctx.measureText(text).width > maxWidth) text = text.slice(0, -2) + '…'
      ctx.fillText(text, R - 16, 1.5)
      ctx.restore()
    }
    ctx.restore()

    ctx.beginPath()
    ctx.arc(c, c, 22, 0, TAU)
    ctx.fillStyle = '#fff'
    ctx.fill()
  }
  draw(0);

  const landAt = winSlice.start + winSlice.size * (0.1 + 0.8 * Math.random());
  const delta = (((-landAt) % TAU) + TAU) % TAU;
  const spins = Math.max(3, Math.round((duration / 1000) * 1.2));
  const finalRot = spins * TAU + delta;
  const ease = (p) => 1 - Math.pow(1 - p, 4); // easeOutQuart

  const sliceUnderPointer = (rot) => {
    const a = (((-rot) % TAU) + TAU) % TAU;
    return slices.findIndex((slice) => a >= slice.start && a < slice.start + slice.size);
  };
  let lastIdx = sliceUnderPointer(0);

  setTimeout(() => {
    const timeNow = performance.now()

    function frame(now) {
      const t = Math.min(1, (now - timeNow) / duration)

      const rot = finalRot * ease(t)
      draw(rot)

      const idx = sliceUnderPointer(rot)
      if (idx !== lastIdx) {
        lastIdx = idx
        playSound('tick')
      }

      if (t < 1) return requestAnimationFrame(frame)

      setTimeout(() => {
        let msg
        try { msg = winner.function() } finally {
          notify(msg || winner.display)
          overlay.classList.add('sw-out')
          setTimeout(() => overlay.remove(), 350);
        }
      }, 500);
    }

    frame(timeNow)
  }, 150);
}

let wheelsSpined = 0

function spinWheel(options, duration) {
  if (!duration) duration = Math.max(1000, 5000-wheelsSpined*777)
  wheelsSpined++

  disableInventory()
  justWheel(options, duration)
  setTimeout(enableInventory, duration);
}

export {
  spinWheel
}