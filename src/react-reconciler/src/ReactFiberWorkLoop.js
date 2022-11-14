import { scheduleCallback } from 'scheduler'
import { ChildDeletion, MutationMask, NoFlags, Placement, Update } from './ReactFiberFlags'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { completeWork } from './ReactFiberCompleteWork'
import { commitMutationEffectsOnFiber } from './ReactFiberCommitWork'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates'
let workInProgress = null
let workInProgressRoot = null

export function scheduleUpdateOnFiber (root) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root)
}

function ensureRootIsScheduled(root) {
  if(workInProgressRoot) return
  workInProgressRoot = root
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root))
}

/**
 * 根据fiber构建fiber树，要创建真实的DOM节点，还需要吧真实的DOM节点插入容器
 * @param {*} root 
 */
function performConcurrentWorkOnRoot(root) {
  renderRootSync(root)
  // 开始进行提交阶段
  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  commitRoot(root)
  workInProgressRoot = null
}
function commitRoot(root) {
  const { finishedWork } = root
  printFinishedWork(finishedWork)
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags
  // 如果自己有副作用或者子节点有副作用就进行提交DOM操作
  if(subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root)
  }
  root.current = finishedWork
}
function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null)
  finishQueueingConcurrentUpdates()
}
function renderRootSync(root) {
  prepareFreshStack(root)
  workLoopSync()
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
  const next = beginWork(current, unitOfWork)
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