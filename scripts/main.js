console.log('main.js loading')

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let id = 0
function getId() {
  id++
  return id
}

// Items

let activeZone = null;
let zoneName = 'zone'

function zoneAt(e) {
  return document
    .elementsFromPoint(e.event.clientX, e.event.clientY)
    .find(el => el !== e.target && el.classList.contains(zoneName)) || null;
}

function setActive(zone) {
  if (zone === activeZone) return;
  if (activeZone) activeZone.classList.remove("hover");
  if (zone) zone.classList.add("hover");
  activeZone = zone;
}

const items = {
  sword: {
    image: '/assets/images/sword.png',
    description: 'deals 10 gazzilion dmg, dissapers on use',
    usableOn: 'zone',
    onUse: (element, item) => {
      console.log(`${item.id} was used on ${element.id}`)
      removeItem(item.id)
    }
  }
}

const inventoryDiv = document.getElementById('inventory')
const inventory = []

function addItem(name) {
  const itemInfo = items[name]

  const itemSlot = document.createElement('div')
  itemSlot.classList.add('item-slot')
  itemSlot.innerHTML = `
    <img draggable=false class="item" src="${itemInfo.image}"></img>
    <span class="item-desc">${itemInfo.description}</span>
  `
  inventoryDiv.append(itemSlot)

  const id = 'ITEM'+getId()

  const item = itemSlot.querySelector('img')
  item.id = id
  
  inventory[id] = {
    itemSlot: itemSlot,
    dragRef: hcgDraggable(item, {
      revert: true,
      bringToFront: false,
      onStart: function (e) {
        e.target.style.position = 'fixed'; // ignores inv overflow
        zoneName = itemInfo.usableOn
      },
      onMove: function (e) {
        setActive(zoneAt(e)); // make outline
      },
      onEnd: function (e) {
        e.target.style.position = 'absolute';

        const zone = zoneAt(e);
        setActive(null); // clear outline

        if (e.moved && zone) {
          itemInfo.onUse(zone, item)
        }
      }
    })
  }

  return id
}

function removeItem(id) {
  const item = inventory[id]
  item.dragRef.destroy()
  item.itemSlot.remove()
}

addItem('sword')

// Board

const board = document.getElementById('board')

function createBlankSquare() {
  const newSquare = document.createElement('div')
  newSquare.classList.add('square-default')
  newSquare.classList.add('zone')
  newSquare.style.margin = `${random(5, 50)}px ${random(5, 50)}px ${random(5, 50)}px ${random(5, 50)}px`
  board.append(newSquare)
  return newSquare
}

const square_types = {
  'default': () => {
    return createBlankSquare()
  },
  'text': (label, description) => {
    const newSquare = createBlankSquare()
    newSquare.innerHTML = `
      <span class="label">Hello WORLD</span>
      <span class="description">Lorem ipsum dolor sit amet consectetur adipisicing elit.</span>
    `
    return newSquare
  },
}

function createSquare(type, x, y) {
  if (!square_types[type]) {
    console.warn('Bad square type ' + type);
    return
  }

  return square_types[type]()
}

const map = {
  1: ['default'],
  2: ['default', 'default', 'default', 'default'],
  3: ['default', 'text', 'default'],
  4: ['default', 'default', 'default', 'default'],
  5: ['default', 'default'],
  6: ['default', 'default', 'default', 'default'],
  7: ['default']
}

// createSquare('default')
// createSquare('text')

for (const rowNum in map) {
  const rowSquares = map[rowNum]
  const row = document.createElement('div')
  row.classList.add('board-row')
  board.append(row)
  rowSquares.forEach(element => {
    const newSquare = createSquare(element)
    row.append(newSquare)
  });
}

console.log('main.js loaded')