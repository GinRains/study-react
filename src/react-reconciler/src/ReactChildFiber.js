import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber'
import { ChildDeletion, Placement } from './ReactFiberFlags'
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
  function deleteChild(returnFiber, childToDelete) {
    if(!shouldTrackSideEffects) return
    const deletions = returnFiber.deletions
    if(deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      returnFiber.deletions.push(childToDelete)
    }
  }
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if(!shouldTrackSideEffects) return
    let childToDelete = currentFirstChild
    while(childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
    return null
  }
  /**
   * 
   * @param {*} returnFiber 父fiber
   * @param {*} currentFirstChild 
   * @param {*} element 新的虚拟DOM对象
   * @returns 返回新的第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    const key = element.key
    let child = currentFirstChild
    // 根据新的虚拟DOM，并比较老fiber生成新fiber
    while(child !== null) {
      if(child.key === key) {
        if(child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling)
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return existing
        } else {
          deleteRemainingChildren(returnFiber, child)
        }
      } else {
        deleteChild(returnFiber, child)
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
    if(shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement
    }
  }
  function updateElement(returnFiber, current, element) {
    const elementType = element.type
    if(current !== null) {
      if(current.type === elementType) {
        const existing = useFiber(current, element.props)
        existing.return = returnFiber
        return existing
      }
    }
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null
    if(newChild !== null && typeof newChild === 'object') {
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if(newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild)
          }
        }
        default:
          return null
      }
    }
    return null
  }
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null // 返回的第一个新儿子
    let previousNewFiber = null // 上一个新的fiber
    let newIdx = 0 // 用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstChild // 第一个老fiber
    let nextOldFiber = null // 下一个老fiber
    // 开始第一轮循环，如果老fiber有值，新的虚拟DOM也有值
    for(; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      // 先暂存下一个老fiber
      nextOldFiber = oldFiber.sibling
      // 试图更新或者复用老fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx])
      if(newFiber === null) {
        break
      }
      if(shouldTrackSideEffects) {
        // 没有成功复用老fiber，就删除老fiber
        if(oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber)
        }
      }
      // 指定新fiber的位置
      placeChild(newFiber, newIdx)
      if(previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber
    }

    for(; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx])
      if(newFiber === null) continue
      placeChild(newFiber, newIdx)
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