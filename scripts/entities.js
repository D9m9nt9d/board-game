// entities are anything that is on the square

import { random, getId, arrayRemove, clamp, notify, playSound, randomFromArray } from "./utils.js"
import { squares, areConnected, distanceBetween, getRandomSquareAtRow } from "./squares.js"
import { addItem, disableInventory, enableInventory, item_types, items, pickItem } from "./items.js"
import { playerId } from "./main.js"

const entities = {}

const entity_types = {
  player: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot') // for bigger enemies change entity-slot to entity-slot-big and then in css change it too
      element.classList.add('left')
      element.innerHTML = `<img src="assets/images/man.png" class="
        entity
        player
        alive
      " draggable=false></img>
      <span class="health-label"></span>
      <img src="assets/images/sword.png" class="equipped-item" draggable=false style="opacity:0"></img>
      `

      const equippedItem = element.querySelector('.equipped-item')
      equippedItem.style.right = '-9px'
      equippedItem.style.top = '20px'
      equippedItem.style.transform = 'rotate(45deg)'

      return element
    },
    maxHealth: 100,
    onHealthChanged: defaultOnDmged,
    onDied: (id, entity, message) => {
      setTimeout(() => {
        if (message) {
          notify(message)
          return
        }

        let itemsThatCanHelp = 0
        for (const id in items) {
          const item = items[id]
          const itemInfo = item_types[item.type]
          if (itemInfo.usableAfterDeath) {
            itemsThatCanHelp += 1
          }
        }
        if (itemsThatCanHelp > 0) {
          notify(`You died. You have ${itemsThatCanHelp == 1 ? 'an item' : 'items'} that can help you though`)
        } else {
          notify('You died. Refresh the page to restart')
        }
      }, 500); // timeout incase he dies > picks up an item, and for the dramatic effect
    }
  },
  evilman: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/evil-man.png" class="
        entity 
        alive
        enemy
      " draggable=false></img>
      <span class="health-label"></span>
      <img src="assets/images/sword.png" class="equipped-item" draggable=false style="opacity:0"></img>
      `

      element.style.margin = `${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px`

      const equippedItem = element.querySelector('.equipped-item')
      equippedItem.style.right = '57px'
      equippedItem.style.top = '23px'
      equippedItem.style.transform = 'rotate(-45deg)'

      return element
    },
    maxHealth: 20,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      tryAndAttackPlayer(entityId, playerId, 5)
    },
    onDied: (id, entity) => {
      const player = entities[playerId]
      if (player && (entity.standingOn != player.standingOn)) { return }
      if (random(1, 3) != 1) { return }
      addItem('coin')
    }
  },
  snake: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot-small')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/snake.png" class="
        entity 
        alive
        enemy
      " draggable=false></img>
      <span class="health-label"></span>
      `

      element.style.margin = `${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px`

      return element
    },
    maxHealth: 7,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      tryAndAttackPlayer(entityId, playerId, 7)
    },
  },
  goblin: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot-small')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/goblin.png" class="
        entity 
        alive
        enemy
        coinUse
      " draggable=false></img>
      <span class="health-label"></span>
      <img src="assets/images/dagger.png" class="equipped-item" draggable=false style="opacity:1"></img>
      `

      element.style.margin = `${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px`

      const equippedItem = element.querySelector('.equipped-item')
      equippedItem.style.right = '38px'
      equippedItem.style.top = '0px'
      equippedItem.style.transform = 'rotate(-45deg)'

      return element
    },
    maxHealth: 15,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      const entity = entities[entityId]
      if (entity.friendly) { return }
      tryAndAttackPlayer(entityId, playerId, 3)
    },
    onDied: (id, entity) => {
      const player = entities[playerId]
      if (player && (entity.standingOn != player.standingOn)) { return }
      if (random(1, 3) == 1) { return }
      addItem('dagger')
    }
  },
  ratwizard: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/rat-wizard.png" class="
        entity 
        alive
        enemy
      " draggable=false></img>
      <span class="health-label"></span>
      `

      element.style.margin = `${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px`

      return element
    },
    maxHealth: 18,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      const entity = entities[entityId]
      const player = entities[playerId]
      if (!player) return

      if (entity.standingOn == player.standingOn) {
        if (random(1, 2) == 1) {
          damageEntity(playerId, 5,
            () => {
              disableInventory()
              playSound('swing-', 2)
              entity.element.style.right = '40%'
              return 200
            },
            () => {
              entity.element.style.right = '0%'
              setTimeout(enableInventory, 200);
            }
          )
        } else {
          const square = squares[entity.standingOn]
          const squareId = random(1,2) == 1 ? (randomFromArray(square.connections) || entity.standingOn) : entity.standingOn
          disableInventory()
          entity.element.style.bottom = '30%'
          setTimeout(() => {
            for (let i = 2; i <= random(2,4); i++) createEntity('rat', squareId)
            entity.element.style.bottom = '0%'
            enableInventory()
          }, 200);
        }
      } else if (areConnected(entity.standingOn, player.standingOn)) {
        moveEntity(entityId, player.standingOn)
      }
    },
  },
  rat: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot-small')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/rat.png" class="
        entity 
        alive
        enemy
        rat
      " draggable=false></img>
      <span class="health-label"></span>
      `

      element.querySelector('.health-label').style.top = '30%';
      element.style.margin = `0px ${random(-12, 40)}px ${random(-2, 25)}px 0px`

      return element
    },
    maxHealth: 3,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      tryAndAttackPlayer(entityId, playerId, 2, 0.2)
    },
  },
  veryevilguy: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot-big')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/very-evil-man.png" class="
        entity 
        alive
        enemy
      " draggable=false></img>
      <span class="health-label"></span>
      `

      element.style.transform = 'translate(10%, 0)'
      element.style.margin = `${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px`

      return element
    },
    maxHealth: 150,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      const player = entities[playerId]
      if (!player) return

      const entity = entities[entityId]
      const [distance, nextSquare] = distanceBetween(entity.standingOn, player.standingOn)

      if (distance > 7) return

      if (distance == 0) {
        damageEntity(playerId, 8,
          () => {
            disableInventory()
            playSound('swing-', 2)
            entity.element.style.right = '40%'
            return 200
          },
          () => {
            entity.element.style.right = '0%'
            setTimeout(enableInventory, 200);
          }, 'A nuke or some very good preparations could help against that guy'
        )
      } else {
        moveEntity(entityId, nextSquare)
      }
    },
    onDied: (id, entity) => {
      const player = entities[playerId]
      if (player && (entity.standingOn != player.standingOn)) { return }



    }
  },
  bigzomb: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot-big')
      element.classList.add('right')
      element.innerHTML = `<img src="assets/images/zombie-mutant.png" class="
        entity 
        alive
        enemy
      " draggable=false></img>
      <span class="health-label"></span>
      `

      element.querySelector('.health-label').style.top = '10%';

      element.style.transform = 'translate(18%, 0)'
      element.style.margin = `${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px ${random(0, 10)}px`

      return element
    },
    maxHealth: 80,
    onHealthChanged: defaultOnDmged,
    onTurn: (entityId, playerId) => {
      const player = entities[playerId]
      if (!player) return

      const entity = entities[entityId]
      const [distance, nextSquare] = distanceBetween(entity.standingOn, player.standingOn)

      if (distance > 3) return

      if (distance == 0) {
        damageEntity(playerId, 12,
          () => {
            disableInventory()
            playSound('swing-', 2)
            entity.element.style.right = '50%'
            return 200
          },
          () => {
            entity.element.style.right = '0%'
            setTimeout(enableInventory, 200);
          }, 'Well...'
        )
      } else {
        moveEntity(entityId, nextSquare)
      }
    },
    onDied: (id, entity) => {
      const player = entities[playerId]
      if (player && (entity.standingOn != player.standingOn)) { return }
      const randomItem = pickItem({
        'nuke': 5,
        'sneak': 5,
        'amulet': 4,
        'coin': 2,
        'apple': 2,
      })
      notify('Zombie dropped a rugged sword and ' + randomItem)
      addItem('rugged-sword')
      addItem(randomItem)
    }
  },
}

const enemies = ['evilman', 'goblin', 'snake']

function defaultOnDmged(id, entity) {
  const healthLabel = entity.element.querySelector('.health-label')
  healthLabel.style.opacity = 1
  healthLabel.textContent = `${entity.health}/${entity.maxHealth}`
}

function tryAndAttackPlayer(entityId, playerId, damage, volume = 1) {
  const entity = entities[entityId]
  const player = entities[playerId]
  if (!player) return

  if (entity.standingOn == player.standingOn) {
    damageEntity(playerId, damage,
      () => {
        disableInventory()
        playSound('swing-', 2, volume)
        entity.element.style.right = '40%'
        return 200
      },
      () => {
        entity.element.style.right = '0%'
        setTimeout(enableInventory, 200);
      }
    )
  } else if (areConnected(entity.standingOn, player.standingOn)) {
    moveEntity(entityId, player.standingOn)
  }
}

function createEntity(type, squareId) {
  const entityInfo = entity_types[type]

  const element = entityInfo.create()

  const id = 'ENTITY' + getId()

  const entity = element.querySelector('.entity')
  entity.id = id

  entities[id] = {
    type: type,
    element: element,
    maxHealth: entityInfo.maxHealth,
    health: entityInfo.maxHealth,
    standingOn: squareId,
  }

  const square = squares[squareId]
  square.element.append(element)
  square.entities.push(id)

  setTimeout(() => {
    square.onStepped.forEach(func => {
      func(id, squareId)
    })
  }, 0);

  return id
}

function moveEntity(entityId, squareId, scroll) {
  const entity = entities[entityId]
  if (!entity) {
    console.warn('Invalid entity id: ' + entityId)
    return
  }

  const newSquare = squares[squareId]
  if (!newSquare) {
    console.warn('Invalid square id: ' + squareId)
    return
  }

  const standingOn = squares[entity.standingOn]
  arrayRemove(standingOn.entities, entityId)

  entity.standingOn = squareId
  newSquare.entities.push(entityId)

  disableInventory()

  entity.element.style.opacity = 0
  setTimeout(() => {
    if (entity.element.isDead) { return }
    newSquare.element.append(entity.element)

    if (scroll) entity.element.scrollIntoView({ behavior: "smooth" })

    setTimeout(() => {
      entity.element.style.opacity = 1

      newSquare.onStepped.forEach(func => {
        func(entityId, squareId)
      })

      enableInventory()
    }, 200)
  }, 200);
}

function removeEntity(id, fireDie = true, message) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: ' + id)
    return
  }

  if (fireDie) {
    const onDied = entity_types[entity.type].onDied
    if (onDied) onDied(id, entity, message)
  }

  const standingOn = squares[entity.standingOn]
  arrayRemove(standingOn.entities, id)

  entity.element.isDead = true
  entity.element.remove()

  const bugged = document.getElementById(id)
  if (bugged) bugged.remove()

  delete entities[id]
}

function setHealth(id, amount, fireDie = true, message) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: ' + id)
    return
  }

  entity.health = clamp(amount, 0, entity.maxHealth)

  const onHpChanged = entity_types[entity.type].onHealthChanged
  if (onHpChanged) onHpChanged(id, entity)

  if (entity.health <= 0) {
    removeEntity(id, fireDie, message)
  }
}

function damageEntity(id, amount = 2,
  before = () => { return 0 },
  after = () => { },
  message,
) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: ' + id)
    return
  }

  entity.friendly = false

  const time = before()
  setTimeout(() => {
    setHealth(id, entity.health - amount, true, message)
    after()
  }, time);
}

function everyoneMoves(playerId, amount = 1) {
  for (const id in entities) {
    const onTurn = entity_types[entities[id].type].onTurn
    if (!onTurn) continue
    for (let i = 1; i <= amount; i++) {
      onTurn(id, playerId)
    }
  }
}

export {
  createEntity, removeEntity,
  moveEntity, damageEntity, everyoneMoves,
  entities,
  entity_types, enemies,
}