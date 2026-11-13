// Items are whats in your inventory and what you can use on squares or entities

import { entities, damageEntity, moveEntity, everyoneMoves, createEntity } from './entities.js'
import { distanceBetweenInPixels, getId, notify, playSound } from './utils.js'
import { areConnected, removeSquare, connectSquares, drawPaths, squares, removePath, distanceBetween } from './squares.js'

import { playerId, changePlayerId } from './main.js'

const items = {}

let maxRow = 5

const item_types = {
  move: {
    image: 'assets/images/move.png',
    description: 'drag this onto the square you want to move to',
    usableOn: 'square',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (player.standingOn == element.id) { notify("You're already here"); return }
      if (!areConnected(player.standingOn, element.id)) { notify('Too far'); return }

      const squareRow = squares[element.id].row
      if (squareRow > maxRow) { maxRow = squareRow }

      moveEntity(playerId, element.id)
      return true
    },
    otherMoves: 2,
    notLoseable: true,
  },
  sneak: {
    image: 'assets/images/sneak.png',
    description: 'sneak past enemies',
    usableOn: 'square',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (player.standingOn == element.id) { notify("You're already here"); return }
      if (!areConnected(player.standingOn, element.id)) { notify('Too far'); return }

      moveEntity(playerId, element.id)
      return true
    },
    uses: 1,
  },
  sword: {
    image: 'assets/images/sword.png',
    description: 'deals 5 damage, everyone moves 1 turn',
    usableOn: 'enemy',
    onUse: (element, item) => {
      const player = entities[playerId]
      const enemy = entities[element.id]
      if (player.standingOn != enemy.standingOn) {
        notify('Too far')
        return
      }

      const equippedItem = player.element.querySelector('.equipped-item')

      damageEntity(element.id, 5,
        () => {
          disableInventory()
          playSound('swing-', 2)
          equippedItem.src = 'assets/images/sword.png'
          equippedItem.style.opacity = 1
          player.element.style.left = '40%'
          return 200
        },
        () => {
          equippedItem.style.opacity = 0
          player.element.style.left = '0%'
          setTimeout(enableInventory, 200);
        }
      )

      return 400
    },
    otherMoves: 1,
    notLoseable: true,
  },
  dagger: {
    image: 'assets/images/dagger.png',
    description: 'deals 3 damage',
    usableOn: 'enemy',
    onUse: (element, item) => {
      const player = entities[playerId]
      const enemy = entities[element.id]
      if (player.standingOn != enemy.standingOn) {
        notify('Too far')
        return
      }

      const equippedItem = player.element.querySelector('.equipped-item')

      damageEntity(element.id, 3,
        () => {
          disableInventory()
          playSound('swing-', 2)
          equippedItem.src = 'assets/images/dagger.png'
          equippedItem.style.opacity = 1
          player.element.style.left = '20%'
          return 200
        },
        () => {
          equippedItem.style.opacity = 0
          player.element.style.left = '0%'
          setTimeout(enableInventory, 200);
        }
      )

      return 400
    },
    uses: 1,
  },
  apple: {
    image: 'assets/images/apple.png',
    description: 'drag this onto yourself to heal for 20 health',
    usableOn: 'player',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (player.health >= player.maxHealth) {
        notify('Already at full health')
        return
      }

      playSound('apple-', 3)
      damageEntity(playerId, -20)
      return true
    },
    uses: 1,
  },
  nuke: {
    image: 'assets/images/nuke.png',
    description: 'removes a space',
    usableOn: 'square',
    onUse: (element, item) => {
      playSound('loud-explosion-', 2, 0.7)
      removeSquare(element.id)
      return true
    },
    uses: 1,
  },
  rope: {
    image: 'assets/images/vibrant-rope.png',
    description: 'connect a space with the space your standing on',
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

      playSound('rope')
      connectSquares(element.id, player.standingOn)
      drawPaths()
      return true
    },
    uses: 2,
  },
  scissors: {
    image: 'assets/images/scissors.png',
    description: 'removes a path',
    usableOn: 'connection',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (distanceBetweenInPixels(element, squares[player.standingOn].element) > 520) {
        notify('Too far')
        return
      }

      playSound('scissors')
      removePath(element)
      return true
    },
    uses: 3,
  },
  coin: {
    image: 'assets/images/coin.png',
    description: "use this to befriend a goblin (it won't attack you)",
    usableOn: 'goblin',
    onUse: (element, item) => {
      const entity = entities[element.id]
      const player = entities[playerId]
      if (!(player.standingOn == entity.standingOn) && !areConnected(player.standingOn, entity.standingOn)) {
        notify('Too far')
        return
      }

      playSound('coin')
      entity.element.style.zIndex = 5
      entity.friendly = true
      return true
    },
    uses: 1,
  },
  amulet: {
    image: 'assets/images/inuit-amulet.png',
    description: 'respawn from the dead',
    usableOn: 'square',
    onUse: (element, item) => {
      const player = entities[playerId]
      if (player) {
        notify('You are not dead')
        return
      }
      if (squares[element.id].row > maxRow) {
        notify(`Can only be used on rows you've already been to (from row 1 to ${maxRow})`)
        return
      }

      playSound('amulet')
      setTimeout(() => {
        changePlayerId(createEntity('player', element.id))
      }, 700);
      return true
    },
    uses: 1,
    usableAfterDeath: true,
  },
}

const itemsToPickFrom = {
  'apple': 40,
  'scissors': 15,
  'rope': 15,
  'coin': 15,
  'dagger': 4,
  'nuke': 2,
  'sneak': 2,
  'amulet': 2,
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

function formatUses(uses) {
  if (!uses) {
    return ''
  } else {
    return ` (${uses} use${uses == 1 ? '' : 's'})`
  }
}

const inventoryDiv = document.getElementById('inventory')

function addItem(name) {
  const itemInfo = item_types[name]

  const itemSlot = document.createElement('div')
  itemSlot.classList.add('item-slot')
  itemSlot.innerHTML = `
    <img draggable=false class="item" src="${itemInfo.image}"></img>
    <span class="item-desc">${itemInfo.description}${formatUses(itemInfo.uses)}</span>
    <span class="moves-amount">${itemInfo.otherMoves || ''}</span>
  `
  inventoryDiv.append(itemSlot)

  const id = 'ITEM' + getId()

  const item = itemSlot.querySelector('img')
  item.id = id

  function itemUsed(zone) {
    console.log(`${item.id} was used on ${zone.id}`)

    if (!itemInfo.usableAfterDeath && !entities[playerId]) {
      notify("You can't use this when you are dead")
      return
    }

    const successOrTime = itemInfo.onUse(zone, item)
    if (!successOrTime) { return }

    if (typeof successOrTime == 'number') {
      setTimeout(() => {
        if (itemInfo.otherMoves) everyoneMoves(playerId, itemInfo.otherMoves)
      }, successOrTime);
    } else {
      if (itemInfo.otherMoves) everyoneMoves(playerId, itemInfo.otherMoves)
    }

    if (itemInfo.uses) {
      const actualItem = items[id]
      const uses = actualItem.uses - 1
      if (uses > 0) {
        actualItem.uses = uses
        actualItem.itemSlot.querySelector('.item-desc').textContent = itemInfo.description + formatUses(uses)
      } else {
        removeItem(item.id)
      }
    }
  }

  items[id] = {
    type: name,
    uses: itemInfo.uses,
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

        if (e.moved && zone) itemUsed(zone)
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

function reconcileItems() {
  const itemsAlreadyHas = new Set()

  for (const id in items) {
    itemsAlreadyHas.add(items[id].type)
  }

  for (const itemName in item_types) {
    if (!itemsAlreadyHas.has(itemName)) {
      addItem(itemName)
    }
  }
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
  addItem, removeItem, reconcileItems,
  itemsToPickFrom, pickItem,
  disableInventory, enableInventory,
}