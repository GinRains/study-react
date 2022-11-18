import { DefaultLane, getHighestPriorityLane, IdleLane, InputContinuousLane, NoLane, SyncLane, includesNonIdleWork } from "./ReactFiberLane";

// 离散事件优先级 click
export const DiscreteEventPriority = SyncLane
// 默认事件车道
export const DefaultEventPriority = DefaultLane
// 连续事件优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane
// 空闲事件优先级
export const IdleEventPriority = IdleLane
let currentUpdatePriority = NoLane

export function getCurrentUpdatePriority() {
  return currentUpdatePriority
}

export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority
}

export function isHigherEventPriority(eventPriority, lane) {
  return (eventPriority !== 0) && eventPriority < lane
}

/**
 * 把lane转成优先级
 * lane 31
 * 事件优先级4
 * 调度优先级5
 * @param {*} lanes 
 * @returns 
 */
export function lanesToEventPriority(lanes) {
  let lane = getHighestPriorityLane(lanes)
  if(!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority // 1
  }
  if(!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority // 4
  }
  if(includesNonIdleWork(lane)) {
    return DefaultEventPriority // 16
  }
  return IdleEventPriority
}