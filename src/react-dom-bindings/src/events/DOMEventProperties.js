import { registerTwoPhaseEvent} from './EventRegistry'

export const topLevelEventsToReactNames = new Map()
const simpleEventPluginEvents = ['click']
export function registerSimpleEvents() {
  for(let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i]
    const domEventName = eventName.toLocaleLowerCase()
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1)
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`)
  }
}

function registerSimpleEvent(domEventName, reactName) {
  // onClick
  // 把原生事件名和react事件名关联起来
  topLevelEventsToReactNames.set(domEventName, reactName)
  registerTwoPhaseEvent(reactName, [domEventName])
}