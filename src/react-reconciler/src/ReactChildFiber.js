import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber'
import { Placement } from './ReactFiberFlags'
import isArray from 'shared/isArray'

/**
 * 
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
  }
  /**
   * 
   * @param {*} returnFiber 根fiber
   * @param {*} currentFirstChild 
   * @param {*} element 新的虚拟DOM对象
   * @returns 返回新的第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    const key = element.key
    let child = currentFirstChild
    while(child !== null) {
      if(child.key === key) {
        if(child.type === element.type) {
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return existing
        }
      }
      child = child.sibling
    }
    // 因为我们实现的初次挂载，老节点currentFirstChild肯定是没有的，所以可以直接根据虚拟DOM创建新的fiber节点
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }
  /**
   * 设置副作用
   * @param {*} newFiber 
   * @returns 
   */
  function placeSingleChild(newFiber) {
    if(shouldTrackSideEffects && newFiber.alternate === null) {
      // 要在最后的提交阶段插入此节点  React渲染分成渲染(创建fiber树)和提交(更新真实DOM) 二个阶段
      newFiber.flags |= Placement
    }

    return newFiber
  }
  function createChild(returnFiber, newChild) {
    if(typeof newChild === 'string' || typeof newChild === 'number') {
      const created = createFiberFromText(`${newChild}`)
      created.return = returnFiber
      return created
    }
    if(typeof newChild === 'object' && newChild !== null) {
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(newChild)
          created.return = returnFiber
          return created
        default:
          break
      }
    }
    return null
  }
  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx
    if(shouldTrackSideEffects) {
      newFiber.flags |= Placement
    }
  }
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null
    let previousNewFiber = null // 上一个新的fiber
    let newIndex = 0
    for(; newIndex < newChildren.length; newIndex++) {
      const newFiber = createChild(returnFiber, newChildren[newIndex])
      if(newFiber === null) continue
      placeChild(newFiber, newIndex)
      if(previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
    return resultingFirstChild
  }
  /**
   * 比较子fiber  DOM-DIFF 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstChild 老fiber的第一个子fiber
   * @param {*} newChild 新的虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // 现在暂时只考虑新的节点只有一个的情况
    if(typeof newChild === 'object' && newChild !== null) {
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild))
        default:
          break
      }
    }
    if(isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
    }
    return null
  }

  return reconcileChildFibers
}

export const reconcileChildFibers = createChildReconciler(true)
export const mountChildFibers = createChildReconciler(false)