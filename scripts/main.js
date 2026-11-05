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

function arrayRemove(arr, value) {
  let index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
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
    usableOn: 'entity',
    onUse: (element, item) => {
      console.log(`${item.id} was used on ${element.id}`)
      removeItem(item.id)
      removeEntity(element.id)
    }
  },
  move: {
    image: '/assets/images/move.png',
    description: 'drag this onto the square you want to move to',
    usableOn: 'square',
    onUse: (element, item) => {
      console.log(`${item.id} was used on ${element.id}`)
      moveEntity(playerId, element.id)
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

  const id = 'ITEM' + getId()

  const item = itemSlot.querySelector('img')
  item.id = id

  inventory[id] = {
    type: name,
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
  delete inventory[id]
}

addItem('sword')
addItem('move')

// Board

const board = document.getElementById('board')

function createBlankSquare() {
  const newSquare = document.createElement('div')
  newSquare.classList.add('square-default')
  newSquare.classList.add('square')
  newSquare.style.margin = `${random(5, 50)}px ${random(5, 50)}px ${random(5, 50)}px ${random(5, 50)}px`
  board.append(newSquare)
  return newSquare
}

const square_types = {
  'text': (square, args) => {
    square.innerHTML += `
      <div class="square-text">
        <span class="label">${args.label}</span>
        <span class="description">${args.description}</span>
      </div>
    `
    return square
  },
}

function addType(square, type, args) {
  if (!square_types[type]) {
    console.warn('Invalid square type: ' + type);
    return
  }

  square_types[type](square, args)
}

const squares = []

function createSquare(types = {}) {
  const square = createBlankSquare()

  for (const type in types) {
    const args = types[type]
    addType(square, type, args)
  }

  const id = 'SQUARE' + getId()
  square.id = id
  squares[id] = {
    element: square,
    entities: [],
  }

  return square
}

function removeSquare(id) {
  const square = squares[id]
  square.element.remove()

  square.entities.forEach(function(id) {
    removeEntity(id)
  })

  delete squares[id]
}

const Default = {}
const Texted = {
  text: {
    label: 'Text',
    description: 'this square has some text in it'
  }
}

const map = {
  1: [ Default ],
  2: [ Default, Default, Default ],
  3: [ Default, Texted, Default ],
  4: [ Default, Default, Default, Default ],
  5: [ Default, Texted ],
  6: [ Default, Default, Default, Default ],
  7: [ Default ]
}

for (const rowNum in map) {
  const row = document.createElement('div')
  row.classList.add('board-row')
  
  const rowSquares = map[rowNum]
  rowSquares.forEach(types => {
    const newSquare = createSquare(types)
    row.append(newSquare)
  });
  
  board.append(row)
}

// Entities

const entity_types = {
  player: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot')
      element.classList.add('left')
      element.innerHTML = `<img src="assets/images/man.png" class="
        entity 
        alive
      " draggable=false></img>`

      return element
    },
    maxHealth: 100,
    onDied: (id, entity) => {
      console.log(id + ' died')
    }
  },
  enemy: {
     create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/evil-man.png" class="
        entity 
        alive
        enemy
      " draggable=false></img>`

      return element
    },
    maxHealth: 20,
  },
}

const entities = {}

function createEntity(type, squareId) {
  const entityInfo = entity_types[type]

  const element = entityInfo.create()

  const id = 'ENTITY' + getId()

  const entity = element.querySelector('.entity')
  entity.id = id

  entities[id] = {
    type: type,
    element: element,
    health: entityInfo.maxHealth,
    standingOn: squareId,
  }

  const square = squares[squareId]
  square.element.append(element)
  square.entities.push(id)

  return id
}

function moveEntity(id, squareId) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: '+id) 
    return
  }
  
  const standingOn = squares[entity.standingOn]
  arrayRemove(standingOn.entities, id)

  const newSquare = squares[squareId]
  entity.standingOn = squareId
  newSquare.entities.push(id)

  newSquare.element.append(entity.element)
}

function removeEntity(id, fireDie = true) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: '+id) 
    return
  }
  
  if (fireDie) {
    const onDied = entity_types[entity.type].onDied
    if (onDied) onDied(id, entity)
  }

  const standingOn = squares[entity.standingOn]
  arrayRemove(standingOn.entities, id)

  entity.element.remove()

  delete entities[id]
}

const playerId = createEntity('player', document.querySelector('.square-default').id)
createEntity('enemy', document.querySelector('.square-default').id)

console.log('main.js loaded')