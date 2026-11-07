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
  const notification = document.createElement('span')
  notification.classList.add('notification')
  notification.textContent = text
  document.body.append(notification)

  setTimeout(() => {
    notification.classList.add('animate')
  }, 1);

  setTimeout(() => {
    notification.remove()
  }, 7000);
}

function distanceBetweenInPixels(el1, el2) {
  const a = el1.getBoundingClientRect()
  const b = el2.getBoundingClientRect()

  const dx = (a.left + a.width / 2) - (b.left + b.width / 2)
  const dy = (a.top + a.height / 2) - (b.top + b.height / 2)

  return Math.hypot(dx, dy)
}

export {
  random, clamp, arrayRemove, randomFromArray,
  getId, notify, distanceBetweenInPixels
}