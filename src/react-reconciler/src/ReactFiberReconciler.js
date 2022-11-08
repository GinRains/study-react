import { createFiberRoot } from './ReactFiberRoot'
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo)
}

export function updateContainer(element, container) {
  // 获取当前fiber
  const current = container.current
  const update = createUpdate()
  update.payload = { element }
  const root = enqueueUpdate(current, update)

  scheduleUpdateOnFiber(root)
}