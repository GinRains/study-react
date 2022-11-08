import { allNativeEvents } from './EventRegistry'
import { IS_CAPTURE_PHASE } from './EventSystemFlags'
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener'
import { addEventCaptureListener, addEventBubbleListener } from './EventListener'
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin'
import getEventTarget from './getEventTarget'
import { HostComponent } from 'react-reconciler/src/ReactWorkTags'
import getListener from './getListener'
SimpleEventPlugin.registerEvents()

const listeningMarker = `_reactListening ${Math.random().toString(36).slice(2)}`
export function listenToAllSupportedEvents(rootContainerElement) {
  // 监听根容器，也就是div#root只监听一次
  if(!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true
  }
  allNativeEvents.forEach((domEventName) => {
    listenToNativeEvent(domEventName, true, rootContainerElement)
    listenToNativeEvent(domEventName, false, rootContainerElement)
  })
}

/**
 * 注册原生事件
 * @param {*} domEventName 原生事件
 * @param {*} isCapturePhaseListener 是否是捕获阶段
 * @param {*} target 目标DOM节点 div#root
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  let eventSystemFlags = 0 // 默认是0指的是冒泡，4是捕获
  if(isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener)
}

function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
  const listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags)
  if(isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener)
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener)
  }
}

export function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
  dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer)
}

function dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
  const nativeEventTarget = getEventTarget(nativeEvent)
  const dispatchQueue = []
  extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer)
  processDispatchQueue(dispatchQueue, eventSystemFlags)
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0
  for(let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i]
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase)
  }
}

function executeDispatch(event, listener, currentTarget) {
  //合成事件实例currentTarget是在不断的变化的
  // event nativeEventTarget 它的是原始的事件源，是永远不变的
  // event currentTarget 当前的事件源，它是会随着事件回调的执行不断变化的
  event.currentTarget = currentTarget;
  listener(event);
}
function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
  if(inCapturePhase) {
    for(let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { currentTarget, listener } = dispatchListeners[i]
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    for(let i = 0; i < dispatchListeners.length; i++) {
      const { currentTarget, listener } = dispatchListeners[i]
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}

function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
  SimpleEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer)
}

export function accumulateSinglePhaseListeners(targetInst, reactName, nativeEventType, isCapturePhase) {
  const captureName = reactName + 'Capture'
  const reactEventName = isCapturePhase ? captureName : reactName
  const listeners = []
  let instance = targetInst
  while(instance !== null) {
    const { stateNode, tag } = instance
    if(tag === HostComponent && stateNode !== null) {
      if(reactEventName !== null) {
        const listener = getListener(instance, reactEventName)
        listener && listeners.push(createDispatchListener(instance, listener, stateNode))
      }
    }
    instance = instance.return
  }
  return listeners
}


function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget }
}