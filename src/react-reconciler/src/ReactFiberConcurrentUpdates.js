import { HostRoot } from "./ReactWorkTags"

const concurrentQueue = []
let concurrentQueueIndex = 0
/**
 * 把更新先缓存到concurrentQueue数组中
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} update 
 */
function enqueueUpdate(fiber, queue, update) {
  concurrentQueue[concurrentQueueIndex++] = fiber
  concurrentQueue[concurrentQueueIndex++] = queue
  concurrentQueue[concurrentQueueIndex++] = update
}
export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueueIndex
  concurrentQueueIndex = 0
  let i = 0
  while(i < endIndex) {
    const fiber = concurrentQueue[i++]
    const queue = concurrentQueue[i++]
    const update = concurrentQueue[i++]
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
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber
  let parent = sourceFiber.return

  while(parent !== null) {
    node = parent
    parent = parent.return
  }
  if(node.tag === HostRoot) {
    return node.stateNode
  }
  return null
}

/**
 * 把更新添加到更新队列中
 * @param {*} fiber 
 * @param {*} queue 
 * @param {*} update 
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update)
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
