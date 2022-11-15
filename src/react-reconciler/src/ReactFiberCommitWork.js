import { MutationMask, Passive, Placement, Update } from "./ReactFiberFlags";
import { appendChild, insertBefore, commitUpdate, removeChild } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { HostRoot, HostComponent, HostText, FunctionComponent } from "./ReactWorkTags";
import { HasEffect as HookHasEffect, Passive as HookPassive } from './ReactHookEffectTags'

let hostParent = null
/**
 * 
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber
  // 一直向上查找，找到真实DOM节点
  findParent: while(parent !== null) {
    switch(parent.tag) {
      case HostComponent: {
        hostParent = parent.stateNode
        break findParent
      }
      case HostRoot: {
        hostParent = parent.stateNode.containerInfo
        break findParent
      }
    }
    parent = parent.return
  }
  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber)
  hostParent = null
}
function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
  switch(deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      // 当要删除一个节点的时候，要先删除它的子节点
      recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber)
      //再把自己删除
      if(hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode)
      }
      break
    }
    default:
      break
  }
}
function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
  let child = parent.child
  while(child !== null) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child)
    child = child.sibling
  }
}
/**
 * 递归循环遍历c处理变更的副作用
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  // 先把父fiber上该删除的子节点都删除
  const deletions = parentFiber.deletions
  if(deletions !== null) {
    for(let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i]
      commitDeletionEffects(root, parentFiber, childToDelete)
    }
  }
  // 再去处理剩下的子节点
  if(parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber
    while(child !== null) {
      commitMutationEffectsOnFiber(child, root)
      child = child.sibling
    }
  }
}
function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork
  // 如果此fiber要执行插入操作的话
  if(flags & Placement) {
    // 进行插入操作，也就是把此fiber对应的真实DOM节点添加到父真实DOM节点上
    commitPlacement(finishedWork)
    // 把flags里的Placement去除
    finishedWork.flags & ~Placement
  }
}
function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot
}
function getHostParentFiber(fiber) {
  let parent = fiber.return
  while(parent !== null) {
    if(isHostParent(parent)) {
      return parent
    }
    parent = parent.return
  }
  return parent
}
/**
 * 把子节点对应的真实DOM插入到父节点DOM中
 * @param {*} node 将要插入的fiber节点
 * @param {*} parent 父真实DOM节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node
  const isHost = tag === HostComponent || tag === HostText
  if(isHost) {
    const { stateNode } = node
    before ? insertBefore(parent, stateNode, before) : appendChild(parent, stateNode)
  } else {
    const { child } = node
    if(child !== null) {
      insertOrAppendPlacementNode(child, before, parent)
      let { sibling } = child
      while(sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent)
        sibling = sibling.sibling
      }
    }
  }
}
/**
 * 找到插入的锚点
 * @param {*} fiber 
 */
function getHostSibling(fiber) {
  let node = fiber
  sibling: while(true) {
    while (node.sibling === null) {
      if(node.return === null || isHostParent(node.return)) {
        return null
      }
      node = node.return
    }
    node = node.sibling
    // 如果弟弟不是原生节点也不是文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      // 如果此节点是一个将要插入的新节点，找他的弟弟
      if(node.falgs & Placement) {
        continue sibling
      } else {
        node = node.child
      }
    }
    if(!(node.flags & Placement)) {
      return node.stateNode
    }
  }
}
function commitPlacement(finishedWork) {
  let parentFiber = getHostParentFiber(finishedWork)
  switch(parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo
      const before = getHostSibling(finishedWork)
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    }
    case HostComponent: {
      const parent = parentFiber.stateNode
      const before = getHostSibling(finishedWork)
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    }
    default:
      break
  }
}
/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate
  const flags = finishedWork.flags
  switch(finishedWork.tag) {
    case FunctionComponent:
    case HostRoot:
    case HostText: {
      // 先遍历它们的子节点，处理副作用
      recursivelyTraverseMutationEffects(root, finishedWork)
      // 再处理自己身上的副作用
      commitReconciliationEffects(finishedWork)
      break
    }
    case HostComponent: {
      // 先遍历它们的子节点，处理副作用
      recursivelyTraverseMutationEffects(root, finishedWork)
      // 再处理自己身上的副作用
      commitReconciliationEffects(finishedWork)
      if(flags & Update) {
        const instance = finishedWork.stateNode
        if(instance !== null) {
          const newProps = finishedWork.memoizedProps
          const oldProps = current !== null ? current.memoizedProps : newProps
          const type = finishedWork.type
          const updatePayload = finishedWork.updateQueue
          if(updatePayload) {
            commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork)
          }
        }
      }
      break
    }
  }
}

export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork)
}

export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork)
}

function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags
  switch(finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      if(flags & Passive) {
        commitHookPassiveUnmountEffects(finishedWork, HookPassive | HookHasEffect )
      }
      break
    }
  }
}
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork)
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if(parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while(child !== null) {
      commitPassiveUnmountOnFiber(child)
      child = child.sibling
    }
  }
}
function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if(lastEffect !== null) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if((effect.tag & flags) === flags) {
        const destroy = effect.destroy
        destroy && destroy()
      }
      effect = effect.next
    } while(effect !== firstEffect)
  }
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags
  switch(finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      if(flags & Passive) {
        commitHookPassiveMountEffects(finishedWork, HookPassive | HookHasEffect )
      }
      break
    }
  }
}
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if(parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while(child !== null) {
      commitPassiveMountOnFiber(root, child)
      child = child.sibling
    }
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}

function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if(lastEffect !== null) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if((effect.tag & flags) === flags) {
        const create = effect.create
        effect.destroy = create()
      }
      effect = effect.next
    } while(effect !== firstEffect)
  }
}