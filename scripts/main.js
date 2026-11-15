console.log('main.js loading')

import { generateMap, drawMap, generatePaths, drawPaths, getRandomSquareAtRow, squares } from './squares.js'
import { createEntity, entities } from './entities.js'
import { addItem, reconcileItems } from './items.js'
import { notify } from './utils.js'

// Items

addItem('move')
addItem('sword')
// addItem('sneak')
// addItem('nuke')
// addItem('rope')
// addItem('apple')
// addItem('scissors')
// addItem('amulet')
// addItem('amulet')
// addItem('coin')
// addItem('coin')
// addItem('coin')
// addItem('coin')
// addItem('dagger')
// addItem('staff')
// addItem('random-sword')

// Entities

let playerId = 'ENTITY0'

function changePlayerId(newId) {
  playerId = newId
}

export { playerId, changePlayerId }

// Board

const map = generateMap(80)
const firstSquareId = drawMap(map)

generatePaths()
drawPaths()
window.addEventListener('load', drawPaths)
window.addEventListener('resize', drawPaths)

// Create player
changePlayerId(createEntity('player', firstSquareId))
// Create boss
createEntity('veryevilguy', getRandomSquareAtRow(75))



// For testers
function spawnBelowPlr(name) {
  const playerRow = squares[entities[playerId].standingOn].row
  const randomId = getRandomSquareAtRow(playerRow + 2)
  if (randomId) {
    notify('Boss spawned')
    createEntity(name, randomId)
  } else {
    notify('Failed to spawn boss')
  }
}

const codes = {
  'boss': () => spawnBelowPlr('veryevilguy'),
  'zombie': () => spawnBelowPlr('bigzomb'),
  'rats': () => {
    for (let i = 1; i <= 3; i++) spawnBelowPlr('rat')
  },
  'wizard': () => spawnBelowPlr('ratwizard'),
  'items': () => {
    reconcileItems()
    notify('Added items')
  },
}

const maxLen = Math.max(...Object.keys(codes).map(c => c.length))
let buffer = ''

window.addEventListener('keydown', (e) => {
  // ignore modifier combos and non-character keys (Shift, Enter, arrows, etc.)
  if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return

  buffer = (buffer + e.key.toLowerCase()).slice(-maxLen)

  for (const word in codes) {
    if (buffer.endsWith(word)) {
      codes[word]()
      buffer = ''
      break
    }
  }
})

console.log('main.js loaded')