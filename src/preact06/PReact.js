import '../requestIdleCallbackPolyfill'

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.flat().map(child => {
                if (typeof child === 'object') {
                    return child
                }
                return createTextElement(child)
            }),
        }
    }
}

function createTextElement(text) {
    return {
        type: 'HostText',
        props: {
            nodeValue: text,
            children: [],
        }
    }
}

let workInProgress = null
let workInProgressRoot = null
let currentHookFiber = null
let currentHookIndex = 0
const isEvent = key => key.startsWith('on')
const isProperty = key => key !== 'children' && !isEvent(key)
const isGone = (prevProps, nextProps) => key => !(key in nextProps)
const isChange = (prevProps, nextProps) => key => (key in prevProps) && (key in nextProps) && prevProps[key] !== nextProps[key]
const isNew = (prevProps, nextProps) => key => !(key in prevProps) && (key in nextProps)

class RootElement {
    _internalRoot = null
    constructor(container) {
        this._internalRoot = {
            current: null,
            container,
        }
    }
    render(element) {
        this._internalRoot.current = {
            alternate: {
                stateNode: this._internalRoot.container,
                props: {
                    children: [element]
                }
            }
        }
        workInProgressRoot = this._internalRoot
        workInProgressRoot.deletions = []
        workInProgress = workInProgressRoot.current.alternate
        window.requestIdleCallback(workloop)
    }
}

function workloop() {
    while (workInProgress) {
        workInProgress = performUnitOfWork(workInProgress)
    }
    if (!workInProgress && workInProgressRoot.current.alternate) {
        commitRoot()
    }
}

function commitRoot() {
    workInProgressRoot.deletions.forEach(commitWork)
    commitWork(workInProgressRoot.current.alternate.child)

    workInProgressRoot.current = workInProgressRoot.current.alternate
    workInProgressRoot.current.alternate = null
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }
    let domParentFiber = null
    if (fiber.return) {
        domParentFiber = fiber.return
        while (!domParentFiber.stateNode) {
            domParentFiber = domParentFiber.return
        }
    }
    if (fiber.effectTag === 'PLACEMENT' && fiber.stateNode) {
        updateDom(fiber.stateNode, {}, fiber.props)
        domParentFiber.stateNode.appendChild(fiber.stateNode)
    } else if (fiber.effectTag === 'UPDATE') {
        updateDom(fiber.stateNode, fiber.alternate.props, fiber.props)
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParentFiber.stateNode)
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function updateDom(stateNode, prevProps, nextProps) {
    // remove or change event binding
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => isGone(prevProps, nextProps)(key) || isChange(prevProps, nextProps)(key))
        .forEach(key => {
            const eventName = key.toLowerCase().substring(2)
            stateNode.removeEventListener(eventName, prevProps[key])
        })
    // remove deleted props 
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(key => isGone(prevProps, nextProps)(key))
        .forEach(key => {
            stateNode[key] = ''
        })
    // set new or change props
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(key => isNew(prevProps, nextProps)(key) || isChange(prevProps, nextProps)(key))
        .forEach(key => {
            stateNode[key] = nextProps[key]
        })
    // add new or change event
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(key => isNew(prevProps, nextProps)(key) || isChange(prevProps, nextProps)(key))
        .forEach(key => {
            const eventName = key.toLowerCase().substring(2)
            stateNode.addEventListener(eventName, nextProps[key])
        })
}

function commitDeletion(fiber, parentStateNode) {
    if (fiber.stateNode) {
        if (parentStateNode.contains(fiber.stateNode)) {
            parentStateNode.removeChild(fiber.stateNode)
        }
    } else {
        commitDeletion(fiber.child, parentStateNode)
    }
}
function performUnitOfWork(fiber) {
    console.log('perform ', fiber)
    // 处理当前 fiber，创建 dom 设置属性
    const isFunctionComponent = typeof fiber.type === 'function'
    if (isFunctionComponent) {
        currentHookFiber = fiber
        currentHookFiber.memorizedState = []
        currentHookIndex = 0
        fiber.props.children = [fiber.type(fiber.props)]
    } else {
        if (!fiber.stateNode) {
            fiber.stateNode = fiber.type === 'HostText' ? document.createTextNode('') : document.createElement(fiber.type)
        }

    }
    // 初始化 children 的 fiber
    reconcileChildren(fiber)
    // 返回下一个要处理的 fiber
    return getNextFiber(fiber)
}

function reconcileChildren(fiber) {
    let prevSibling = null
    // mount 阶段 oldFiber 为空，update 阶段为上一次的值
    let oldFiber = fiber?.alternate?.child
    // fiber.props.children.forEach((child, index) => {
    let index = 0
    while (index < fiber.props.children.length || oldFiber) {
        const child = fiber.props.children[index]
        let newFiber = null
        let sameType = oldFiber && child && child.type === oldFiber.type
        if (child && !sameType) {
            // mount
            newFiber = {
                type: child.type,
                stateNode: null,
                props: child.props,
                return: fiber,
                alternate: null,
                child: null,
                sibling: null,
                effectTag: 'PLACEMENT',
            }
        } else if (sameType) {
            // update
            newFiber = {
                type: child.type,
                stateNode: oldFiber.stateNode,
                props: child.props,
                return: fiber,
                alternate: oldFiber,
                child: null,
                sibling: null,
                effectTag: 'UPDATE'
            }
        } else if (!sameType && oldFiber) {
            // delete
            oldFiber.effectTag = 'DELETION'
            workInProgressRoot.deletions.push(oldFiber)
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }
        if (index === 0) {
            fiber.child = newFiber
        } else {
            if (prevSibling) {
                prevSibling.sibling = newFiber
            }
        }
        prevSibling = newFiber
        index++
    }
    // })

}

function getNextFiber(fiber) {
    // 先遍历 child
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        // 再遍历 sibling
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        // 最后是 return 并找下一个 sibling
        nextFiber = nextFiber.return
    }
    return null
}

function createRoot(container) {
    return new RootElement(container)
}

function act(callback) {
    callback()
    return new Promise(resolve => {
        function loop() {
            if (!workInProgress) {
                resolve()
            } else {
                window.requestIdleCallback(loop)
            }
        }
        loop()
    })
}

function useState(initialState) {
    const oldHook = currentHookFiber.alternate?.memorizedState?.[currentHookIndex]
    const hook = {
        // 承接上一次更新时的 state
        state: oldHook ? oldHook.state : initialState,
        queue: [],
        dispatch: oldHook?.dispatch || null
    }
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })
    const setState = hook.dispatch ? hook.dispatch : (action) => {
        let _action = action
        if (typeof action !== 'function') {
            _action = () => action
        }
        hook.queue.push(_action)
        // re-render
        workInProgressRoot.current.alternate = {
            stateNode: workInProgressRoot.container,
            props: workInProgressRoot.current.props,
            alternate: workInProgressRoot.current, // 重要，交换 alternate
        }
        workInProgressRoot.deletions = []
        workInProgress = workInProgressRoot.current.alternate
        window.requestIdleCallback(workloop)
    }
    currentHookFiber.memorizedState.push(hook)
    currentHookIndex++
    return [hook.state, setState]
}

function useReducer(reducer, initialState) {
    const [state, setState] = useState(initialState)
    const dispatch = (action) => {
        setState(state => reducer(state, action))
    }
    return [state, dispatch]
}

export default {
    createElement,
    createRoot,
    act,
    useState,
    useReducer,
}