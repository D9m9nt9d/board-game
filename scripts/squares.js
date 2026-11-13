// squares are spaces that you can step on that contain entities

import { random, getId, randomFromArray, arrayRemove, notify, playSound } from "./utils.js"
import { createEntity, removeEntity, enemies, damageEntity, entities, entity_types, moveEntity } from "./entities.js"
import { playerId } from "./main.js"
import { addItem, item_types, items, itemsToPickFrom, pickItem, reconcileItems, removeItem } from "./items.js"
import { spinWheel } from "./wheel.js"

const squares = {}

const board = document.getElementById('board')

function createBlankSquare() {
  const newSquare = document.createElement('div')
  newSquare.innerHTML = '<div class="text-container"></div>'
  newSquare.classList.add('square-default')
  newSquare.classList.add('square')
  newSquare.style.margin = `${random(20, 120)}px ${random(10, 70)}px ${random(20, 120)}px ${random(10, 70)}px`
  board.append(newSquare)
  return newSquare
}

function addText(square, label, description) {
  const squareText = document.createElement('div')
  squareText.className = 'square-text'
  squareText.innerHTML = `
    <span class="label">${label}</span>
    <span class="description">${description}</span>`
  square.element.querySelector('.text-container').append(squareText)
  return squareText
}

function addDiv(square, className) {
  const div = document.createElement('div')
  div.classList.add(className)
  div.classList.add('full-square')
  square.element.append(div)
}

let maxRows = 10

function getRandomSquareAtRow(number) {
  for (let row = Math.max(1, number); row <= maxRows; row++) {
    const matches = Object.keys(squares).filter(name => squares[name].row === row);

    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)];
    }
  }

  return null;
}

let wonCD = false

// 100 = always, 1 = 1/100
// onStepped will also run in this order unless addType was called later on
const square_types = {
  'default': {
    chance: 100,
  },
  'spawner': {
    func: (_, square) => addDiv(square, 'spawner'),
    onStepped: (entityId, squareId) => {
      if (entityId != playerId) { return }
      createEntity(randomFromArray(enemies), squareId)
    },
    chance: 14,
  },
  'withEnemy': {
    func: (squareId, _) => createEntity(randomFromArray(enemies), squareId),
    chance: 30,
  },
  'withItem': {
    func: (squareId, square) => {
      const randomItem = pickItem(itemsToPickFrom)
      const itemInfo = item_types[randomItem]

      const img = document.createElement('img')
      img.classList.add('item-small')
      img.id = squareId + randomItem
      img.src = itemInfo.image
      img.draggable = false
      img.style.right = random(10, 50) + '%'
      img.style.top = random(0, 50) + '%'

      square.element.append(img)
      square.loot = randomItem
    },
    onStepped: (entityId, squareId) => {
      if (entityId != playerId) { return }
      const loot = squares[squareId].loot
      if (loot) {
        delete squares[squareId].loot
        addItem(loot)
        document.getElementById(squareId + loot).remove()
      }
    },
    chance: 17,
  },
  'heal': {
    func: (squareId, square) => {
      addText(square, 'Heal', 'Heals anyone that steps on it to full')
      addDiv(square, 'heal')
    },
    onStepped: (entityId, _) => damageEntity(entityId, -100),
    chance: 2,
  },
  'dmg': {
    func: (squareId, square) => {
      addText(square, 'Damage', "Randomly damages anyone that steps on this square")
      addDiv(square, 'dmg')
    },
    onStepped: (entityId, _) => damageEntity(entityId, random(5, 25)),
    chance: 2,
  },
  'bad': {
    func: (_, square) => {
      addText(square, 'Bad square', 'Spin a bad wheel')
      addDiv(square, 'bad')
    },
    onStepped: (entityId, squareId) => {
      if (entityId != playerId) return
      spinWheel([
        {
          display: 'Lose an item', chance: 30, function: () => {
            let removedAnItem = false
            for (const id in items) {
              const itemName = items[id].type
              const itemInfo = item_types[itemName]
              if (!itemInfo.notLoseable) {
                removedAnItem = itemName
                removeItem(id)
                break
              }
            }
            if (removedAnItem) return `Removed ${removedAnItem}`
            damageEntity(playerId, 20)
            return 'No item to be removed, take 20 damage instead'
          }
        },
        {
          display: 'Take 15 damage', chance: 20, function: () => damageEntity(playerId, 15)
        },
        {
          display: 'Take 30 damage', chance: 20, function: () => damageEntity(playerId, 30)
        },
        {
          display: 'Return to start', chance: 2, function: () => {
            moveEntity(playerId, getRandomSquareAtRow(1), true)
          }
        },
        {
          display: 'Go back 5 rows', chance: 10, function: () => {
            const player = entities[playerId]
            if (!player) return
            const playerRow = squares[player.standingOn].row
            moveEntity(playerId, getRandomSquareAtRow(playerRow - 5), true)
          }
        },
        {
          display: 'Spawn an enemy', chance: 30, function: () => {
            createEntity(randomFromArray(enemies), squareId)
            return 'Spawned an enemy'
          }
        },
      ])
      return true
    },
    onUsesEnded: (squareId, square) => square.element.querySelector('.bad').remove(),
    maxUses: 3,
    chance: 5,
  },
  'good': {
    func: (_, square) => {
      addText(square, 'Good square', 'Spin a good wheel')
      addDiv(square, 'good')
    },
    onStepped: (entityId, squareId) => {
      if (entityId != playerId) return
      spinWheel([
        {
          display: 'Get an item', chance: 50, function: () => {
            const itemName = randomFromArray(Object.keys(itemsToPickFrom))
            addItem(itemName)
            return `Got ${itemName}`
          }
        },
        {
          display: 'Heal to full', chance: 50, function: () => {
            damageEntity(playerId, -1000)
            return 'Healed to full'
          }
        },
        {
          display: '+5 Max HP', chance: 30, function: () => {
            entity_types.player.maxHealth += 5
            const player = entities[playerId]
            if (!player) return
            player.maxHealth += 5
            damageEntity(playerId, -5)
          }
        },
        {
          display: 'Go forward 5 rows', chance: 10, function: () => {
            const player = entities[playerId]
            if (!player) return
            const playerRow = squares[player.standingOn].row
            moveEntity(playerId, getRandomSquareAtRow(playerRow + 5), true)
          }
        },
      ])
      return true
    },
    onUsesEnded: (squareId, square) => square.element.querySelector('.good').remove(),
    maxUses: 3,
    chance: 5,
  },
  'swordSharpener': {
    func: (_, square) => {
      addText(square, 'Sword sharpening station', '5% chance to get +1 dmg')
      addDiv(square, 'good')
    },
    onStepped: (entityId, squareId) => {
      if (entityId != playerId) return
      spinWheel([
        {
          display: 'Sharpen sword', chance: 5, function: () => {}
        },
        {
          display: 'Nothing', chance: 95, function: () => {}
        },
      ])
      return true
    },
    maxUses: 1,
    onUsesEnded: (squareId, square) => square.element.querySelector('.good').remove(),
    chance: 5,
  },
  'win': {
    func: (squareId, square) => {
      addText(square, 'Win', 'GG!').classList.add('win-text')
      square.element.classList.add('win-outline')
      const div = document.createElement('div')
      div.classList.add('win')
      div.classList.add('full-square')
      square.element.append(div)
    },
    onStepped: (entityId, _) => {
      if (wonCD) { return }
      if (entityId != playerId) { return }

      wonCD = true
      playSound('wind-chimes-bells')

      notify('Congratulations on making it to the bottom! As a reward take all these items!')
      damageEntity(entityId, -100)
      reconcileItems()

      setTimeout(() => {
        notify('Just kidding, as a reward you get the joy of being able to complete the game again.')
        setTimeout(() => {
          for (const id in items) removeItem(id)
          removeEntity(entityId)
          addItem('move')
          addItem('sword')
          wonCD = false
        }, 2500);
      }, 10000);
    },
    chance: 0,
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

  const maxUses = typeInfo.maxUses
  const uniqueUses = type+'USES'
  if (maxUses) square[uniqueUses] = random(typeInfo.minUses || 1, maxUses)
  
  const onStepped = 
  maxUses 
  ? ((entityId, squareId) => {
    if (square[uniqueUses] <= 0) return
    const success = typeInfo.onStepped(entityId, squareId)
    if (!success) return
    square[uniqueUses] = square[uniqueUses] - 1
    if (square[uniqueUses] <= 0) typeInfo.onUsesEnded(squareId, square)
  })
  : typeInfo.onStepped

  typeInfo.func && typeInfo.func(squareId, square)
  onStepped && square.onStepped.push(onStepped)
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

  generated[1] = [['default']]
  generated[rows] = [['win']]

  for (let rowNum = 2; rowNum <= rows - 1; rowNum++) {
    const count = random(min, max)
    generated[rowNum] = Array.from(
      { length: count }, () => pickSquare()
    )
  }

  maxRows = rows

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

  window.scroll({
    behavior: 'smooth',
    top: 0,
  })

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