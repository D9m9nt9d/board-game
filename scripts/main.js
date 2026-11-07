console.log('main.js loading')

import { generateMap, drawMap, generatePaths, drawPaths } from './squares.js'
import { createEntity } from './entities.js'
import { addItem } from './items.js'

// Items

addItem('sword')
addItem('move')
addItem('nuke')
addItem('rope')
addItem('apple')
addItem('scissors')
addItem('amulet')

// Board

const map = generateMap(25)
const firstSquareId = drawMap(map)

generatePaths()
drawPaths()
window.addEventListener('load', drawPaths)
window.addEventListener('resize', drawPaths)

// Entities

let playerId = createEntity('player', firstSquareId)

function changePlayerId(newId) {
  playerId = newId
}

export {playerId, changePlayerId}

console.log('main.js loaded')