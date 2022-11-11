import logger, { indent } from 'shared/logger'
import { HostRoot, HostComponent, HostText, FunctionComponent, IndeterminateComponent } from './ReactWorkTags'
import { processUpdateQueue } from './ReactFiberClassUpdateQueue'
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber'
import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { renderWithHooks } from './ReactFiberHooks'

/**
 * 根据新的虚拟DOM生成新的fiber链表
 * @param {*} current 老的父fiber
 * @param {*} workInProgress 新的fiber
 * @param {*} nextChildren 新的虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  // 如果此新fiber没有老fiber，说明此新fiber是新创建的
  if(current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    // 有老fiber的话，需要DOM-DIFF 拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren)
  }
}
function updateHostRoot(current, workInProgress) {
  processUpdateQueue(workInProgress)
  const nextState = workInProgress.memoizedState
  // nextChildren就是新的子虚拟DOM
  const nextChildren = nextState.element
  // 协调子节点  DOM-DIFF算法
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}
function updateHostComponent(current, workInProgress) {
  const { type, pendingProps: nextProps } = workInProgress
  let nextChildren = nextProps.children
  // 判断当前虚拟DOM的儿子是不是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps)
  if(isDirectTextChild) {
    nextChildren = null
  }
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}
/**
 * 挂载函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} component 函数组件
 */
function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps
  // const value = Component(props)
  const value = renderWithHooks(current, workInProgress, Component, props)
  workInProgress.tag = FunctionComponent
  reconcileChildren(current, workInProgress, value)
  return workInProgress.child
}
export function updateFunctionComponent(current, workInProgress, Component, nextProps) {
  const nextChildren = renderWithHooks(current, workInProgress, Component, nextProps)
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}
export function beginWork(current, workInProgress) {
  // logger(' '.repeat(indent.number) + 'beginwork', workInProgress)
  // indent.number += 2
  switch(workInProgress.tag) {
    // 组件有两种，一种是函数组件，一种是类组件
    case IndeterminateComponent:
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type)
    case FunctionComponent:
      const Component = workInProgress.type
      const nextProps = workInProgress.pendingProps
      return updateFunctionComponent(current, workInProgress, Component, nextProps)
    case HostRoot:
      return updateHostRoot(current, workInProgress)
    case HostComponent:
      return updateHostComponent(current, workInProgress)
    case HostText:
      return null
    default:
      return null
  }
}