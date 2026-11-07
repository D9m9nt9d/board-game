// squares are spaces that you can step on that contain entities

import { random, getId, randomFromArray, arrayRemove } from "./utils.js"
import { createEntity, removeEntity, enemies, damageEntity } from "./entities.js"
import { playerId } from "./main.js"
import { addItem, item_types } from "./items.js"

const squares = {}

const board = document.getElementById('board')

function createBlankSquare() {
  const newSquare = document.createElement('div')
  newSquare.classList.add('square-default')
  newSquare.classList.add('square')
  newSquare.style.margin = `${random(20, 120)}px ${random(10, 70)}px ${random(20, 120)}px ${random(10, 70)}px`
  board.append(newSquare)
  return newSquare
}

function addText(square, label, description) {
  square.element.innerHTML += `
  <div class="square-text">
    <span class="label">${label}</span>
    <span class="description">${description}</span>
  </div>`
}

function pickItem(items) {
  const entries = Object.entries(items)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)

  let roll = Math.random() * total
  for (const [name, weight] of entries) {
    roll -= weight
    if (roll < 0) return name
  }
}


// 100 = always, 1 = 1/100
const square_types = {
  'default': {
    chance: 100,
  },
  'spawner': {
    func: (squareId, square, args) => {
      const div = document.createElement('div')
      div.classList.add('spawner')
      div.classList.add('full-square')
      square.element.append(div)
    },
    onStepped: (entityId, squareId) => {
      if (entityId != playerId) { return }
      createEntity(randomFromArray(enemies), squareId)
    },
    chance: 20,
  },
  'withEnemy': {
    func: (squareId, square, args) => {
      createEntity(randomFromArray(enemies), squareId)
    },
    chance: 40,
  },
  'withItem': {
    func: (squareId, square, args) => {
      const itemsToPickFrom = {
        'apple': 40,
        'scissors': 15,
        'rope': 15,
        'nuke': 2,
        'amulet': 2,
      }
      const randomItem = pickItem(itemsToPickFrom)
      const itemInfo = item_types[randomItem]

      const img = document.createElement('img')
      img.classList.add('item-small')
      img.id = squareId + randomItem
      img.src = itemInfo.image
      img.draggable = false
      img.style.right = random(10,50) + '%'
      img.style.top = random(0,50) + '%'

      square.element.append(img)
      square.loot = randomItem
    },
    onStepped: (entityId, squareId) => {
      if (entityId!=playerId) {return}
      const loot = squares[squareId].loot
      if (loot) {
        delete squares[squareId].loot
        addItem(loot)
        document.getElementById(squareId + loot).remove()
      }
    },
    chance: 10,
  },
  'heal': {
    func: (squareId, square, args) => {
      addText(square, 'Heal', 'Heals anyone that steps on it to full')
      const div = document.createElement('div')
      div.classList.add('heal')
      div.classList.add('full-square')
      square.element.append(div)
    },
    onStepped: (entityId, _) => {
      damageEntity(entityId, -100)
    },
    chance: 5,
  }
}

function addType(squareId, type) {
  const typeInfo = square_types[type]
  if (!typeInfo) {
    console.warn('Invalid square type: ' + type);
    return
  }

  const square = squares[squareId]
  if (!square) {
    console.warn('Invalid square id' + squareId)
  }

  typeInfo.func && typeInfo.func(squareId, square)
  typeInfo.onStepped && square.onStepped.push(typeInfo.onStepped)
}

function createSquare(types = {}, row = 0) {
  const square = createBlankSquare()

  const id = 'SQUARE' + getId()
  square.id = id
  squares[id] = {
    element: square,
    row: row,
    entities: [],
    connections: [],
    onStepped: [],
  }

  types.forEach(type => {
    addType(id, type)
  })

  return square
}

function removeSquare(id) {
  const square = squares[id]
  square.element.classList.remove('square')
  square.element.style.visibility = 'hidden'

  square.connections.forEach(otherId => {
    const other = squares[otherId]
    arrayRemove(other.connections, id)
  })

  square.entities.forEach(id => {
    removeEntity(id)
  })

  delete squares[id]

  drawPaths()
}

function pickSquare() {
  const picked = []

  for (const [name, type] of Object.entries(square_types)) {
    if (Math.random() * 100 < type.chance) picked.push(name)
  }

  return picked
}

function generateMap(rows, min = 1, max = 4) {
  const generated = {}
  
  generated[1]    = [ ['default'] ]
  generated[rows] = [ ['default'] ]

  for (let rowNum = 2; rowNum <= rows - 1; rowNum++) {
    const count = random(min, max)
    generated[rowNum] = Array.from(
      { length: count }, () => pickSquare()
    )
  }

  return generated
}

function drawMap(map) {
  let firstSquareId = null

  for (const rowNum in map) {
    const row = document.createElement('div')
    row.classList.add('board-row')
    row.id = 'ROW' + rowNum

    const rowSquares = map[rowNum]
    rowSquares.forEach(types => {
      const newSquare = createSquare(types, Number(rowNum))
      row.append(newSquare)
      if (!firstSquareId) firstSquareId = newSquare.id
    });

    board.append(row)
  }

  return firstSquareId
}

function connectSquares(idA, idB) {
  if (idA === idB) return false
  const a = squares[idA]
  const b = squares[idB]
  if (a.connections.includes(idB)) return false

  a.connections.push(idB)
  b.connections.push(idA)
  return true
}

function removePath(path) {
  const squareIds = path.id.split("SPLIT")
  const idOne = squareIds[0]
  const idTwo = squareIds[1]

  arrayRemove(squares[idOne].connections, idTwo)
  arrayRemove(squares[idTwo].connections, idOne)
  
  path.remove()
}

function generatePaths(randomness = 0.5) {
  // rows left to right
  const rows = {}
  for (const id in squares) {
    const rect = squares[id].element.getBoundingClientRect();
    const row = rows[squares[id].row] ??= []
    row.push({ id, x: rect.left + rect.width / 2 })
  }
  const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b)
  rowKeys.forEach(r => rows[r].sort((a, b) => a.x - b.x))

  // link each row to the one below it
  for (let k = 0; k < rowKeys.length - 1; k++) {
    const A = rows[rowKeys[k]]
    const B = rows[rowKeys[k + 1]]

    let i = 0, j = 0
    connectSquares(A[i].id, B[j].id)

    // go both rows at once, so always stepping toward the closer neighbor
    while (i < A.length - 1 || j < B.length - 1) {
      if (i === A.length - 1) j++
      else if (j === B.length - 1) i++
      else {
        let stepA = Math.abs(A[i + 1].x - B[j].x) < Math.abs(A[i].x - B[j + 1].x)
        if (Math.random() < randomness) stepA = !stepA
        stepA ? i++ : j++
      }
      connectSquares(A[i].id, B[j].id)
    }
  }
}

function randomColor(min = 170, max = 240) {
  const v = random(min, max)
  return `rgb(${v}, ${v}, ${v})`
}

function drawPaths() {
  const oldPaths = board.querySelector('svg.paths')
  if (oldPaths) oldPaths.remove()

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('paths')
  board.prepend(svg)

  const boardRect = board.getBoundingClientRect()

  for (const id in squares) {
    squares[id].connections.forEach(otherId => {
      if (id > otherId) return // draw each path once it ignores letters
      const [up, down] = squares[id].row <= squares[otherId].row ? [id, otherId] : [otherId, id]
      const a = squares[up].element.getBoundingClientRect()
      const b = squares[down].element.getBoundingClientRect()
      const x1 = a.left - boardRect.left + a.width / 2, y1 = a.bottom - boardRect.top
      const x2 = b.left - boardRect.left + b.width / 2, y2 = b.top - boardRect.top
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.classList.add('connection')
      line.id = id + 'SPLIT' + otherId
      line.setAttribute('x1', x1); line.setAttribute('y1', y1)
      line.setAttribute('x2', x2); line.setAttribute('y2', y2)
      line.setAttribute('stroke', randomColor())
      line.setAttribute('stroke-width', '5px')
      svg.append(line)
    })
  }
}

function distanceBetween(idOne, idTwo) {
  const seen = new Set([idOne]) // array with no repetitions and has instead of includes
  let frontier = [idOne]
  let dist = 0

  while (frontier.length) {
    if (frontier.includes(idTwo)) return dist
    const next = []
    for (const id of frontier) {
      for (const n of squares[id].connections) {
        if (!seen.has(n)) {
          seen.add(n)
          next.push(n)
        }
      }
    }
    frontier = next
    dist++
  }
  return Infinity
}

function areConnected(idOne, idTwo, between = 0) {
  return distanceBetween(idOne, idTwo) === between + 1
}

export {
  squares,
  generateMap, drawMap,
  generatePaths, drawPaths, removePath,
  createSquare, removeSquare, connectSquares,
  areConnected, distanceBetween,
}