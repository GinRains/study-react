import logger, { indent } from "shared/logger"
import { HostComponent, HostText, HostRoot, FunctionComponent } from "./ReactWorkTags"
import { createTextInstance, createInstance, appendInitialChild, finalizeInitialChildren, prepareUpdate } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { NoFlags, Update } from "./ReactFiberFlags"

function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child
  while(node) {
    if(node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode)
    } else if(node.child !== null) {
      node = node.child
      continue
    }
    if(node === workInProgress) return
    while(node.sibling === null) {
      if(node.return === null || node.return === workInProgress) {
        return
      }
      node = node.return
    }
    node = node.sibling
  }
}
function markUpdate(workInProgress) {
  workInProgress.flags |= Update
}
/**
 * 更新DOM
 * @param {*} current 
 * @param {*} workInProgress 
 * @param {*} type 
 * @param {*} newProps 
 */
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps
  const instance = workInProgress.stateNode
  // 比较新老属性，收集有差异的属性 ['id', 'bnts' ]
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps)
  workInProgress.updateQueue = updatePayload
  console.log('aaa', workInProgress.updateQueue)
  if(updatePayload) {
    markUpdate(workInProgress)
  }
}
/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新构建的fiber
 */
export function completeWork(current, workInProgress) {
  // indent.number -= 2
  // logger(' '.repeat(indent.number) + 'completeWork', workInProgress)
  const newProps = workInProgress.pendingProps
  switch(workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress)
      break
    case HostComponent:
      const { type } = workInProgress
      // 如果老fiber存在，并且老fiber上存在DOM节点，要走更新逻辑
      if(current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps)
      } else {
        const instance = createInstance(type, newProps, workInProgress)
        // 把所有的儿子都挂载到自己身上
        workInProgress.stateNode = instance
        appendAllChildren(instance, workInProgress)
        finalizeInitialChildren(instance, type, newProps)
      }
      bubbleProperties(workInProgress)
      break
    case FunctionComponent:
      bubbleProperties(workInProgress)
      break
    case HostText:
      const newText = newProps
      workInProgress.stateNode = createTextInstance(newText)
      // 向上冒泡属性
      bubbleProperties(workInProgress)
      break
  }
}

function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags
  // 遍历当前fiber 的所有子节点，把所有的子节点的副作用，以及子节点的子节点的副作用全部合并起来
  let child = completedWork.child
  if(child !== null) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags
    child = child.sibling
  }
  completedWork.subtreeFlags = subtreeFlags
}