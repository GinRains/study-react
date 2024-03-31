import { HostComponent, HostRoot, IndeterminateComponent } from './ReactWorkTags'
import { HostText } from './ReactWorkTags'
import { NoFlags } from './ReactFiberFlags'
import { NoLanes } from './ReactFiberLane'

/**
 * 
 * @param {*} tag fiber的类型 =>函数组件...
 * @param {*} pendingProps 新属性
 * @param {*} key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag // fiber 标识，根组件是3
  this.key = key // 用户定义的key
  this.type = null // 来自于虚拟DOM的类型，span、h1
  this.stateNode = null // 此fiber对应的真实DOM节点 h1 => 真实的h1DOM

  this.return = null // 指向父节点
  this.child = null // 指向第一个子节点
  this.sibling = null // 指向弟弟节点

  this.pendingProps = pendingProps // 等待生效的属性
  this.memoizedProps = null // 已经生效的属性

  this.memoizedState = null // 每个fiber还会有自己的状态

  this.updateQueue = null // 每个fiber身上可能还有更新队列

  this.flags = NoFlags // 副作用的标识
  this.subtreeFlags = NoFlags // 子节点对应的副作用标识
  this.alternate = null // 当前fiber的新或者旧fiber
  this.index = 0 // 默认孩子节点的所引
  this.deletions = null // 是否有需要删除的子元素
  this.lanes = NoLanes // 优先级
  this.childLanes = NoLanes // 子元素的优先级
  this.ref = null // 真实DOM
}
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key)
}
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null)
}

/**
 * 基于老的fiber和新的属性创建新的fiber
 * @param {*} current 老fiber
 * @param {*} pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate
  if(workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.type = current.type
    workInProgress.stateNode = current.stateNode
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    workInProgress.pendingProps = pendingProps
    workInProgress.type = current.type
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
  }

  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState
  workInProgress.updateQueue = current.updateQueue
  workInProgress.sibling = current.sibling
  workInProgress.index = current.index
  workInProgress.ref = current.ref;
  workInProgress.flags = current.flags;
  workInProgress.lanes = current.lanes;
  workInProgress.childLanes = current.childLanes;
  
  return workInProgress
}

/**
 * 根据虚拟DOM创建fiber节点
 * @param {*} element
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element
  return createFiberFromTypeAndProps(type, key, pendingProps)
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent
  if(typeof type === 'string') { // 如果此type是 字符串span h1 说明此fiber是一个原生组件
    tag = HostComponent
  }
  const fiber = createFiber(tag, pendingProps, key)
  fiber.type = type
  return fiber
}

export function createFiberFromText(content) {
  return createFiber(HostText, content, null)
}