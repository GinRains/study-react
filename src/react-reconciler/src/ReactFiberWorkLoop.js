import { 
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  cancelCallback as Scheduler_cancelCallback
} from './Scheduler'
import { ChildDeletion, MutationMask, NoFlags, Passive, Placement, Update } from './ReactFiberFlags'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { completeWork } from './ReactFiberCompleteWork'
import { commitMutationEffectsOnFiber, commitPassiveUnmountEffects, commitPassiveMountEffects, commitLayoutEffects } from './ReactFiberCommitWork'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates'
import { NoLanes, markRootUpdated, getNextLanes, getHighestPriorityLane, SyncLane, includesBlockingLane, NoLane } from './ReactFiberLane'
import { ContinuousEventPriority, DefaultEventPriority, DiscreteEventPriority, getCurrentUpdatePriority, lanesToEventPriority, setCurrentUpdatePriority } from './ReactEventPriorities'
import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { scheduleSyncCallback, flushSyncCallbacks } from './ReactFiberSyncTaskQueue'
let workInProgress = null
let workInProgressRoot = null
let workInProgressRootRenderLanes = NoLanes
let rootDoesHavePassiveEffect = false // 此根节点上有没有useEffect类似得副作用
let rootWithPendingPassiveEffects = null // 具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
// 构建fiber树正在进行中
const RootInProgress = 0
// 构建fiber树已经完成
const RootCompleted = 5
// 当渲染工作结束的时候当前的fiber树处于什么状态，默认进行中
let workInProgressRootExitStatus = RootInProgress

export function scheduleUpdateOnFiber (root, fiber, lane) {
  markRootUpdated(root, lane)
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root)
}

// 在根上执行同步工作
function performSyncWorkOnRoot(root) {
  const lanes = getNextLanes(root)
  renderRootSync(root, lanes)
  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  commitRoot(root)
  return null
}

function ensureRootIsScheduled(root) {
  const existingCallbackNode = root.callbackNode
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, workInProgressRootRenderLanes)
  if(nextLanes === NoLanes) {
    return
  }
  let newCallbackPriority = getHighestPriorityLane(nextLanes)
  const exitingCallbackPriority = root.callbackPriority
  // 如果新的优先级和老的优先级一样，则可以进行批量更新
  if(exitingCallbackPriority === newCallbackPriority) {
    return
  }
  if(existingCallbackNode !== null) {
    console.log('cancelCallback')
    Scheduler_cancelCallback(existingCallbackNode)
  }
  // 新的回调任务
  let newCallbackNode = null
  // 如果新的优先级是同步的话
  if(newCallbackPriority === SyncLane) {
    // 先把performSyncWorkOnRoot添回到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    // 再把flushSyncCallbacks放入微任务
    queueMicrotask(flushSyncCallbacks)
    // 如果是同步任务
    newCallbackNode = null
  } else {
    let schedulerPriorityLevel
    switch(lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    newCallbackNode = Scheduler_scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));
  }
  root.callbackNode = newCallbackNode
  root.callbackPriority = newCallbackPriority

  // if(workInProgressRoot) return
  // workInProgressRoot = root
  // Scheduler_scheduleCallback(NormalSchedulerPriority, performConcurrentWorkOnRoot.bind(null, root))
}

/**
 * 根据fiber构建fiber树，要创建真实的DOM节点，还需要吧真实的DOM节点插入容器
 * @param {*} root 
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  const originalCallbackNode = root.callbackNode
  const lanes = getNextLanes(root, NoLanes)
  if(lanes === NoLanes) {
    return null
  }
  // 所以说默认更新车道是同步的，不能启用
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && (!didTimeout)
  const exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes)

  // 如果不是渲染中的话，那就说明渲染完了
  if(exitStatus !== RootInProgress) {
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    commitRoot(root)
  }
  // 说明任务没有完成
  if(root.callbackNode === originalCallbackNode) {
    return performConcurrentWorkOnRoot.bind(null, root)
  }

  return null
  // renderRootSync(root, lanes)
  // 开始进行提交阶段
  // const finishedWork = root.current.alternate
  // root.finishedWork = finishedWork
  // commitRoot(root)
  // return null
}

function renderRootConcurrent(root, lanes) {
  if(workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes)
  }
  workLoopConcurrent()
  if(workInProgress !== null) {
    return RootInProgress
  }
  return workInProgressRootExitStatus
}
function flushPassiveEffect() {
  // console.log('下一个宏任务中flushPassiveEffect~~~')
  if(rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects
    // 执行卸载副作用
    commitPassiveUnmountEffects(root.current)
    // 执行挂载副作用
    commitPassiveMountEffects(root, root.current)
  }
}
function commitRoot(root) {
  const previousUpdatePriority = getCurrentEventPriority()
  try {
    // 把当前的更新优先级设置为1
    setCurrentUpdatePriority(DiscreteEventPriority)
    commitRootImpl(root)
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority)
  }
}
function commitRootImpl(root) {
  const { finishedWork } = root
  workInProgressRoot = null
  workInProgressRootRenderLanes = NoLanes
  root.callbackNode = null
  root.callbackPriority = NoLane
  if ((finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags) {
      if(!rootDoesHavePassiveEffect) {
        rootDoesHavePassiveEffect = true
        // printFinishedWork(finishedWork)
        Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffect)
      }
  }
  // console.log('开始commit~~~')
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags
  // 如果自己有副作用或者子节点有副作用就进行提交DOM操作
  if(subtreeHasEffects || rootHasEffect) {
    // console.log('DOM执行变更commitMutationEffectsOnFiber~~~')
    commitMutationEffectsOnFiber(finishedWork, root)
    // console.log('DOM执行变更后commitLayoutEffects~~~')
    // 执行Layout Effect
    commitLayoutEffects(finishedWork, root)
    if(rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false
      rootWithPendingPassiveEffects = root
    }
  }
  root.current = finishedWork
}
function prepareFreshStack(root, renderLanes) {
  workInProgress = createWorkInProgress(root.current, null)
  workInProgressRootRenderLanes = renderLanes
  workInProgressRoot = root
  finishQueueingConcurrentUpdates() // 把函数组件更新队列放在queue里
}
function renderRootSync(root, renderLanes) {
  if(root !== workInProgressRoot || workInProgressRootRenderLanes !== renderLanes) {
    prepareFreshStack(root, renderLanes)
  }

  workLoopSync()
  return RootCompleted
}

function workLoopConcurrent() {
  // 如果有下一个要构建的fiber并且时间片没有过期
  while(workInProgress !== null && !shouldYield()) {
    sleep(200)
    performUnitOfWork(workInProgress)
    // console.log('shouldYield', shouldYield(), workInProgress)
  }
}
function workLoopSync() {
  while(workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

/**
 * 
 * @param {*} unitOfWork 新fiber
 */
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes)
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  if(next === null) {
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork
  do {
    const current = completedWork.alternate
    const returnFiber = completedWork.return
    completeWork(current, completedWork)
    const siblingFiber = completedWork.sibling
    if(siblingFiber !== null) {
      workInProgress = siblingFiber
      return
    }
    completedWork = returnFiber
    workInProgress = completedWork
  } while(completedWork !== null)
  if(workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted
  }
}

/**
 * 打印完成的工作
 * @param {*} fiber 
 */
function printFinishedWork(fiber) {
  const { flags, deletions } = fiber
  if((flags & ChildDeletion) !== NoFlags) {
    fiber.flags &= (~ChildDeletion)
    console.log('子节点删除 ' + (deletions.map(fiber => `${fiber.type}#${fiber.memoizedProps.id}`).join(',')))
  }
  let child = fiber.child
  while(child) {
    printFinishedWork(child)
    child = child.sibling
  }
  if(fiber.flags !== 0) {
    console.log(getFlags(fiber), getTag(fiber.tag), typeof fiber.type === 'function' ? fiber.type.name : fiber.type, fiber.memoizedProps)
  }
}

function getFlags(fiber) {
  const { flags, deletions } = fiber
  if(flags === (Placement | Update)) {
    return '移动'
  }
  if(flags === Placement) {
    return '插入'
  }
  if(flags === Update) {
    return '更新'
  }
  return flags
}

function getTag(tag) {
  switch(tag) {
    case HostRoot:
      return 'HostRoot'
    case FunctionComponent:
      return 'FunctionComponent'
    case HostComponent:
      return 'HostComponent'
    case HostText:
      return 'HostText'
    default:
      return tag
  }
}

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority()
  if(updateLane !== NoLanes) {
    return updateLane
  }
  const eventLane = getCurrentEventPriority()
  return eventLane
}

function sleep(duration) {
  const timeStamp = new Date().getTime()
  const endTime = timeStamp + duration
  while(true) {
    if(new Date().getTime() > endTime) {
      return 
    }
  }
}