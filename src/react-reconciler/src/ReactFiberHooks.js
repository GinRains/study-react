import ReactSharedInternals from "shared/ReactSharedInternals"
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'

let workInProgressHook = null
let currentlyRenderingFiber = null
let currentHook = null
const { ReactCurrentDispatcher } = ReactSharedInternals
const HooksDispatcherOnMount = {
  useReducer: mountReducer
}
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer
}

function updateWorkInProgressHook() {
  if(currentHook === null) {
    const current = currentlyRenderingFiber.alternate
    currentHook = current.memoizedState
  } else {
    currentHook = currentHook.next
  }

  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null
  }
  if(workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
  } else {
    workInProgressHook = workInProgressHook.next = newHook
  }
  return workInProgressHook
}
function updateReducer(reducer, initialArg) {
  const hook = updateWorkInProgressHook()
  const queue = hook.queue
  const current = currentHook // 老的hook
  const pendingQueue = queue.pending
  let newState = current.memoizedState
  if(pendingQueue !== null) {
    queue.pending = null
    const firstUpdate = pendingQueue.next
    let update = firstUpdate
    do{
      const action = update.action
      newState = reducer(newState, action)
      update = update.next
    } while(update !== null && update !== firstUpdate)
  }

  hook.memoizedState = newState
  return [hook.memoizedState, queue.dispatch]
}
function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialArg
  const queue = {
    pending: null,
    dispatch: null
  }
  hook.queue = queue
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue))
  return [hook.memoizedState, dispatch]
}
/**
 * 执行派发动作的方法，更新状态，并更新界面
 * @param {*} fiber 
 * @param {*} queue 更新队列
 * @param {*} action 
 */
function dispatchReducerAction(fiber, queue, action) {
  // 在每个hook里会存放一个更新队列，更新队列是一个更新对象的循环链表
  const update = {
    action, // 派发的动作{ type: 'add', payload: 1 }
    next: null // 指向下一个更新对象
  }
  // 把当前最新的更新添加到更新队列中，并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update)
  scheduleUpdateOnFiber(root, fiber)
}
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    queue: null,
    next: null // 指向下一个hook，一个函数里可以有多个hook，它们会组成一个单向链表
  }
  if(workInProgressHook === null) {
    // 当前函数对应的fiber状态对应第一个hook节点
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    workInProgressHook = workInProgressHook.next = hook
  }

  return workInProgressHook
}
/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress
  // 如果有老fiber，并且有老的hook链表
  if(current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount
  }
  // 需要在函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props)
  currentlyRenderingFiber = null
  workInProgressHook = null
  return children
}