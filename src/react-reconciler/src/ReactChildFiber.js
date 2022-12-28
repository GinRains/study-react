import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber'
import { ChildDeletion, Placement } from './ReactFiberFlags'
import isArray from 'shared/isArray'
import { HostText } from './ReactWorkTags'

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
          existing.ref = element.ref
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
    created.ref = element.ref
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
          created.ref = newChild.ref
          created.return = returnFiber
          return created
        default:
          break
      }
    }
    return null
  }
  function placeChild(newFiber, lastPlacedIndex, newIdx) {
    
    newFiber.index = newIdx
    if(!shouldTrackSideEffects) {
      return lastPlacedIndex
    }
    const current = newFiber.alternate
    if(current !== null) {
      const oldIndex = current.index
      if(oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement
        return lastPlacedIndex
      } else {
        return oldIndex
      }
    } else {
      newFiber.flags |= Placement
      return lastPlacedIndex
    }
  }
  function updateElement(returnFiber, current, element) {
    const elementType = element.type
    if(current !== null) {
      if(current.type === elementType) {
        const existing = useFiber(current, element.props)
        existing.ref = element.ref
        existing.return = returnFiber
        return existing
      }
    }
    const created = createFiberFromElement(element)
    created.ref = element.ref
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
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map()
    let existingChild = currentFirstChild
    while(existingChild !== null) {
      if(existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild)
      } else {
        existingChildren.set(existingChild.index, existingChild)
      }
      existingChild = existingChild.sibling
    }
    return existingChildren
  }
  function updateTextNode(returnFiber, current, textContent) {
    if(current === null || current.tag !== HostText) {
      const created = createFiberFromElement(textContent)
      created.return = returnFiber
      return created
    } else {
      const existing = useFiber(current, textContent)
      existing.return = returnFiber
      return existing
    }
  }
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIdx) || null
      return updateTextNode(returnFiber, matchedFiber, '' + newChild)
    }
    if(typeof newChild === 'object' && newChild !== null) {
      switch(newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const matchedFiber = existingChildren.get(newChild.key !== null ? newChild.key : newIdx) || null
          return updateElement(returnFiber, matchedFiber, newChild)
      }
    }
  }
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null // 返回的第一个新儿子
    let previousNewFiber = null // 上一个新的fiber
    let newIdx = 0 // 用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstChild // 第一个老fiber
    let nextOldFiber = null // 下一个老fiber
    let lastPlacedIndex = 0
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
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
      if(previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber
    }
    // 新的虚拟DOM已经循环完毕，3 => 2
    if(newIdx === newChildren.length) {
      // 删除剩下得老fiber
      deleteRemainingChildren(returnFiber, oldFiber)
      return resultingFirstChild
    }
    if(oldFiber === null) {
      // 如果老fiber已经没有了，新的虚拟DOM还有，就插入新节点
      for(; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx])
        if(newFiber === null) continue
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
        if(previousNewFiber === null) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
      }
    }
    // 开始处理移动得情况
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber)
    for(; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx])
      if(newFiber !== null) {
        if(shouldTrackSideEffects) {
          if(newFiber.alternate !== null) {
            existingChildren.delete(newFiber.key !== null ? newFiber.key : newIdx)
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
        if(previousNewFiber === null) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
      }
    }
    if(shouldTrackSideEffects) {
      // 等全部处理完后，删除map中剩下得老fiber
      existingChildren.forEach(child => deleteChild(returnFiber, child))
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