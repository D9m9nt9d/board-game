function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max)
}

let id = 0
function getId() {
  id++
  return id
}

function arrayRemove(arr, value) {
  let index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function randomFromArray(arr) {
  return arr[random(0, arr.length - 1)]
}

function notify(text) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = text;
  document.body.append(notification);

  notification.addEventListener('animationend', () => notification.remove(), { once: true });
}

function distanceBetweenInPixels(el1, el2) {
  const a = el1.getBoundingClientRect()
  const b = el2.getBoundingClientRect()

  const dx = (a.left + a.width / 2) - (b.left + b.width / 2)
  const dy = (a.top + a.height / 2) - (b.top + b.height / 2)

  return Math.hypot(dx, dy)
}

function playSound(name, variations, volume, speed) {
  var audio = new Audio(`assets/sounds/${name}${variations ? random(1, variations) : ''}.mp3`);
  audio.volume = volume ? volume : 1
  audio.playbackRate = speed ? (1 + Math.random() * speed) : 1
  audio.play();
}

function getStartEndPos(board, el1, el2) {
  const b = board.getBoundingClientRect()

  const centerIn = (rect) => ({
    x: rect.left - b.left - board.clientLeft + board.scrollLeft + rect.width / 2,
    y: rect.top - b.top - board.clientTop + board.scrollTop + rect.height / 2,
  })

  const p = el1.getBoundingClientRect()
  const s = el2.getBoundingClientRect()

  const start = centerIn(p)
  start.y -= p.height / 2 + 65 // 65px above
  const end = centerIn(s)

  const pos = ({ x, y }) => `translate(${x}px, ${y}px) translate(-50%, -50%)`

  return [pos(start), pos(end)]
}

export {
  random, clamp, arrayRemove, randomFromArray,
  getId, notify, distanceBetweenInPixels,
  playSound,
  getStartEndPos,
}