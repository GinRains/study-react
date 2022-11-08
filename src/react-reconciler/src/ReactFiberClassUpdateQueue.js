
import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates'
import assign from 'shared/assign'
export const UpdateState = 0

export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      pending: null
    }
  }

  fiber.updateQueue = queue
}

export function createUpdate() {
  return { tag: UpdateState }
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue
  const shared = updateQueue.shared
  const pending = shared.pending

  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }

  updateQueue.shared.pending = update
  return markUpdateLaneFromFiberToRoot(fiber)
}

export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue
  const pendingQueue = queue.shared.pending
  if(pendingQueue !== null) {
    queue.shared.pending = null
    const lastPendingUpdate = pendingQueue
    const firstPendingUpdate = lastPendingUpdate.next
    lastPendingUpdate.next = null
    let newState = workInProgress.memoizedState
    let update = firstPendingUpdate
    while(update) {
      newState = getStateFromUpdate(update, newState)
      update = update.next
    }
    workInProgress.memoizedState = newState
  }
}

/**
 * 根据老状态更新计算新状态
 * @param {*} update 
 * @param {*} prevState 
 */
function getStateFromUpdate(update, prevState) {
  switch(update.tag) {
    case UpdateState:
      const { payload } = update
      return assign({}, prevState, payload)
  }
}