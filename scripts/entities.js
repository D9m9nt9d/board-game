// entities are anything that is on the square

import { random, getId, arrayRemove } from "./utils.js"
import { squares } from "./squares.js"

const entities = {}

const entity_types = {
  player: {
    create: () => {
      const element = document.createElement('div')
      element.classList.add('entity-slot') // for bigger enemies change entity-slot to entity-slot-big and then in css change it too
      element.classList.add('left')
      element.innerHTML = `<img src="assets/images/man.png" class="
        entity 
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
    onDied: (id, entity) => {
      console.log(id + ' died')
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
    onDamaged: defaultOnDmged,
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
    maxHealth: 20,
    onDamaged: defaultOnDmged,
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
    maxHealth: 20,
    onDamaged: defaultOnDmged,
  },
}

const enemies = ['evilman', 'goblin', 'snake']

function defaultOnDmged(id, entity) {
  const healthLabel = entity.element.querySelector('.health-label')
  healthLabel.style.opacity = 1
  healthLabel.textContent = `${entity.health}/${entity.maxHealth}`
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

  return id
}

function moveEntity(entityId, squareId) {
  const entity = entities[entityId]
  if (!entity) {
    console.warn('Invalid entity id: ' + entityId)
    return
  }

  const standingOn = squares[entity.standingOn]
  arrayRemove(standingOn.entities, entityId)

  const newSquare = squares[squareId]
  entity.standingOn = squareId
  newSquare.entities.push(entityId)

  newSquare.element.append(entity.element)

  newSquare.onStepped.forEach(func => {
    func(entityId, squareId)
  })
}

function removeEntity(id, fireDie = true) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: ' + id)
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

function damageEntity(id, amount = 2, fireDie = true) {
  const entity = entities[id]
  if (!entity) {
    console.warn('Invalid entity id: ' + id)
    return
  }

  entity.health -= amount

  const onDmged = entity_types[entity.type].onDamaged
  if (onDmged) onDmged(id, entity)

  if (entity.health <= 0) {
    removeEntity(id, fireDie)
  }
}

export {
  createEntity, removeEntity,
  moveEntity, damageEntity,
  entities,
  entity_types, enemies,
}