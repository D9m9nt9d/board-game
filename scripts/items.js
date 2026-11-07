// Items are whats in your inventory and what you can use on squares or entities

import { entities, damageEntity, moveEntity, everyoneMoves } from './entities.js'
import { distanceBetweenInPixels, getId, notify } from './utils.js'
import { areConnected, removeSquare, connectSquares, drawPaths, squares, removePath } from './squares.js'

import { playerId, changePlayerId } from './main.js'

const items = {}

const item_types = {
  move: {
    image: '/assets/images/move.png',
    description: 'drag this onto the square you want to move to, everyone moves 2 turns',
    usableOn: 'square',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (player.standingOn == element.id) { notify("You're already here"); return }
      if (!areConnected(player.standingOn, element.id)) { notify('Too far'); return }

      moveEntity(playerId, element.id)
      everyoneMoves(playerId, 2)
    }
  },
  apple: {
    image: '/assets/images/apple.png',
    description: 'drag this onto yourself to heal for 10 health',
    usableOn: 'player',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (player.health < player.maxHealth) {
        damageEntity(playerId, -10)
      } else {
        notify('Already at full health')
      }
    }
  },
  sword: {
    image: '/assets/images/sword.png',
    description: 'deals 5 damage, everyone moves 1 turn',
    usableOn: 'enemy',
    onUse: (element, item) => {
      const player = entities[playerId]
      const enemy = entities[element.id]
      if (player.standingOn == enemy.standingOn) {
        damageEntity(element.id, 5)
        everyoneMoves(playerId, 1)
      } else {
        notify('Too far')
      }
    }
  },
  nuke: {
    image: '/assets/images/nuke.png',
    description: 'removes a space',
    usableOn: 'square',
    onUse: (element, item) => {
      removeSquare(element.id)
    }
  },
  rope: {
    image: '/assets/images/vibrant-rope.png',
    description: 'connect a space with the space your currently standing on',
    usableOn: 'square',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (distanceBetweenInPixels(element, squares[player.standingOn].element) > 520) {
        notify('Too far')
        return
      }
      if (areConnected(element.id, player.standingOn)) {
        notify('Already connected')
        return
      }
      connectSquares(element.id, player.standingOn)
      drawPaths()
    }
  },
  scissors: {
    image: '/assets/images/scissors.png',
    description: 'removes a path',
    usableOn: 'connection',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (distanceBetweenInPixels(element, squares[player.standingOn].element) > 520) {
        notify('Too far')
        return
      }
      removePath(element)
    }
  },
}

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

const inventoryDiv = document.getElementById('inventory')

function addItem(name) {
  const itemInfo = item_types[name]

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

  items[id] = {
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
          console.log(`${item.id} was used on ${zone.id}`)
          itemInfo.onUse(zone, item)
        }
      }
    })
  }

  return id
}

function removeItem(id) {
  const item = items[id]
  item.dragRef.destroy()
  item.itemSlot.remove()
  delete items[id]
}

function disableInventory() {
  for (const id in items) {
    items[id].dragRef.disable().reset()
  }
  setActive(null); // clear outline
}
function enableInventory() {
  for (const id in items) {
    items[id].dragRef.enable()
  }
}

export {
  item_types, items,
  addItem, removeItem,
  disableInventory, enableInventory
}