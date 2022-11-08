import logger, { indent } from "shared/logger"
import { HostComponent, HostText, HostRoot } from "./ReactWorkTags"
import { createTextInstance, createInstance, appendInitialChild, finalizeInitialChildren } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { NoFlags } from "./ReactFiberFlags"

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
/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新构建的fiber
 */
export function completeWork(current, workInProgress) {
  indent.number -= 2
  logger(' '.repeat(indent.number) + 'completeWork', workInProgress)
  const newProps = workInProgress.pendingProps
  switch(workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress)
      break
    case HostComponent:
      const { type } = workInProgress
      const instance = createInstance(type, newProps, workInProgress)
      // 把所有的儿子都挂载到自己身上
      workInProgress.stateNode = instance
      appendAllChildren(instance, workInProgress)
      finalizeInitialChildren(instance, type, newProps)
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