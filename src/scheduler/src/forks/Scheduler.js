import { push, peek, pop } from "./SchedulerMinHeap";
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority
} from './SchedulerPriorities';

function getCurrentTime() {
  return performance.now()
}
var maxSigned31BitInt = 1073741823;
// Times out immediately 立刻过期 -1
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out 250毫秒
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
// 正常优先级的过期时间 5秒
var NORMAL_PRIORITY_TIMEOUT = 5000;
// 低优先级过期时间 10秒
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out 永远不过期
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
//任务ID计数器
let taskIdCounter = 1;
//任务的最小堆
const taskQueue = [];
let scheduleHostCallback = null;
let startTime = -1;
let currentTask = null;
//React每一帧向浏览申请5毫秒用于自己任务执行
//如果5MS内没有完成，React也会放弃控制权，把控制交还给浏览器
const frameInterval = 5;

const channel = new MessageChannel()
var port1 = channel.port1
var port2 = channel.port2
port1.onmessage = performWorkUntilDeadline
/**
 * 按优先级
 * @param {*} priorityLevel 优先级
 * @param {*} callback 
 */
export function scheduleCallback(priorityLevel, callback) {
  // 获取当前时间
  const currentTime = getCurrentTime()
  // 此任务的开始时间
  const startTime = currentTime
  // 超时时间
  let timeout
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;// -1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;// 250ms
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT; //1073741823
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT; //10000
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT; //5000
      break;
  }
  const expirationTime = startTime + timeout
  const newTask = {
    id: taskIdCounter++,
    callback, // 工作函数
    priorityLevel, // 优先级别
    startTime, // 开始时间
    expirationTime, // 过期时间
    sortIndex: expirationTime
  }
  push(taskQueue, newTask)
  // flushWork 执行工作
  requestHostCallback(workLoop)
  return newTask
}

function flushWork(starTime) {
  return workLoop()
}
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime
  if(timeElapsed < frameInterval) {
    return false
  }
  return true
}
function workLoop() {
  let currentTime = startTime
  currentTask = peek(taskQueue)
  while(currentTask !== null) {
    if(currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 跳出工作循环
      break
    }
    const callback = currentTask.callback
    if(typeof callback === 'function') {
      currentTask.callback = null
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
      const continueCallback = callback(didUserCallbackTimeout)
      if(typeof continueCallback === 'function') {
        currentTask.callback = continueCallback
        return true
      }
      // 如果此任务已经完成，则不需要继续执行了，弹出去
      if(currentTask === peek(taskQueue)) {
        pop(taskQueue)
      }
    } else {
      pop(taskQueue)
    }
    // 如果当前任务执行完了，或者任务不合法，取出下一个任务继续执行
    currentTask = peek(taskQueue)
  }
  if(currentTask !== null) {
    return true
  }
  return false
}
function requestHostCallback(workLoop) {
  // 缓存回调
  scheduleHostCallback = workLoop
  // 执行工作直到截至时间
  schedulePerformWorkUntilDeadline()
}
function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null)
}
function performWorkUntilDeadline() {
  if(scheduleHostCallback) {
    // 时间片开始
    startTime = getCurrentTime()
    let hasMoreWork = true
    try {
      hasMoreWork = scheduleHostCallback(startTime)
    } finally {
      if(hasMoreWork) {
        // 继续执行
        schedulePerformWorkUntilDeadline()
      } else {
        scheduleHostCallback = null
      }
    }
  }
}

export {
  shouldYieldToHost as shouldYield,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority
}