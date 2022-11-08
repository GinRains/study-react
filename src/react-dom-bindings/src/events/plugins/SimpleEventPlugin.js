import { registerSimpleEvents, topLevelEventsToReactNames } from '../DOMEventProperties' 
import { IS_CAPTURE_PHASE } from '../EventSystemFlags'
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem'
import { SyntheticMouseEvent } from '../SyntheticEvent';

/**
 * 把要执行回调函数添加到dispatchQueue中
 * @param {*} dispatchQueue 
 * @param {*} domEventName 
 * @param {*} targetInst 
 * @param {*} nativeEvent 
 * @param {*} nativeEventTarget 
 * @param {*} eventSystemFlags 
 * @param {*} targetContainer 
 */
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
  const reactName = topLevelEventsToReactNames.get(domEventName)
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0
  let SyntheticEventCtor
  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }
  const listeners = accumulateSinglePhaseListeners(targetInst, reactName, nativeEvent.type, isCapturePhase)
  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName, domEventName, null, nativeEvent, nativeEventTarget);
    dispatchQueue.push({
      event,//合成事件实例
      listeners//监听函数数组
    });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents }