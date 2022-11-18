import getEventTarget from './getEventTarget'
import { getClosestInstanceFromNode } from '../client/ReactDOMComponentTree'
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem'
import { ContinuousEventPriority, DefaultEventPriority, DiscreteEventPriority, getCurrentUpdatePriority, setCurrentUpdatePriority } from 'react-reconciler/src/ReactEventPriorities'

export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
  const listenerWrapper = dispatchDiscreteEvent
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer)
}

/**
 * 派发离散的事件监听函数
 * @param {*} domEventName 事件名
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器 div#root
 * @param {*} nativeEvent 原生事件
 */
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  // 在点击按钮的时候，需要设置更新优先级
  const previousPriority = getCurrentUpdatePriority()
  try {
    setCurrentUpdatePriority(DiscreteEventPriority)
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent)
  } finally {
    setCurrentUpdatePriority(previousPriority)
  }
}

/**
 * 此方法就是委托给容器的回调，当容器#root在捕获或者说冒泡阶段处理事件的时候会执行该函数
 * @param {*} domEventName 
 * @param {*} eventSystemFlags 
 * @param {*} container 
 * @param {*} nativeEvent 
 */
export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  const nativeEventTarget = getEventTarget(nativeEvent)
  const targetInst = getClosestInstanceFromNode(nativeEventTarget)
  dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer)
}

export function getEventPriority(domEventName) {
  switch(domEventName) {
    case 'click':
      return DiscreteEventPriority
    case 'drag':
      return ContinuousEventPriority
    default:
      return DefaultEventPriority
  }
}