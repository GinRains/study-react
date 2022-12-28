import { createHostRootFiber } from './ReactFiber'
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue'
import { NoLanes, NoLane, createLaneMap, NoTimestamp } from './ReactFiberLane'

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo
  // 表示此根上有哪些赛道等待被处理
  this.pendingLanes = NoLanes
  this.callbackNode = null
  this.callbackPriority = NoLane
  // 过期时间
  this.expirationTimes = createLaneMap(NoTimestamp)
  // 过期赛道
  this.expiredLanes = NoLanes
}

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo)
  const uninitializedFiber = createHostRootFiber()
  root.current = uninitializedFiber
  uninitializedFiber.stateNode = root
  initialUpdateQueue(uninitializedFiber)

  return root
}