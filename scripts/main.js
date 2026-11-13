console.log('main.js loading')

import { generateMap, drawMap, generatePaths, drawPaths, squares } from './squares.js'
import { createEntity } from './entities.js'
import { addItem } from './items.js'

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
// addItem('dagger')
// addItem('staff')

// Entities

let playerId = 'ENTITY0'

function changePlayerId(newId) {
  playerId = newId
}

export {playerId, changePlayerId}

// Board

const map = generateMap(80)
const firstSquareId = drawMap(map)

generatePaths()
drawPaths()
window.addEventListener('load', drawPaths)
window.addEventListener('resize', drawPaths)

// Create player

changePlayerId(createEntity('player', firstSquareId))

console.log('main.js loaded')