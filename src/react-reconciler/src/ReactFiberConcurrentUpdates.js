import { HostRoot } from "./ReactWorkTags"

const concurrentQueues = []
let concurrentQueueIndex = 0
/**
 * 把更新先缓存到concurrentQueue数组中
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} update 
 */
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueueIndex++] = fiber
  concurrentQueues[concurrentQueueIndex++] = queue
  concurrentQueues[concurrentQueueIndex++] = update // 更新对象
  concurrentQueues[concurrentQueueIndex++] = lane // 更新对应的车道
}
export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueueIndex
  concurrentQueueIndex = 0
  let i = 0
  while(i < endIndex) {
    const fiber = concurrentQueues[i++]
    const queue = concurrentQueues[i++]
    const update = concurrentQueues[i++]
    const lane = concurrentQueues[i++]
    if(queue !== null && update !== null) {
      const pending = queue.pending
      if(pending === null) {
        update.next = update
      } else {
        update.next = pending.next
        pending.next = update
      }
      queue.pending = update
    }
  }
}

/**
 * 把更新入队
 * @param {*} fiber 根fiber
 * @param {*} queue shareQueue 待生效的队列
 * @param {*} update 更新
 * @param {*} lane 更新车道
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane)
  return getRootForUpdatedFiber(fiber)
}

/**
 * 把更新添加到更新队列中，并返回根fiber
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} update 
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane)
  return getRootForUpdatedFiber(fiber)
}

function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber
  let parent = node.return
  while(parent !== null) {
    node = parent
    parent = parent.return
  }

  return node.tag === HostRoot ? node.stateNode : null
}
