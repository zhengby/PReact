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
        workInProgress = workInProgressRoot.current.alternate
        window.requestIdleCallback(workloop)
    }
}

function workloop() {
    while (workInProgress) {
        workInProgress = performUnitOfWork(workInProgress)
    }
    if (!workInProgress && workInProgressRoot.current.alternate) {
        workInProgressRoot.current = workInProgressRoot.current.alternate
        workInProgressRoot.current.alternate = null
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
            Object.keys(fiber.props).forEach(key => {
                if (key === 'children') {
                    return
                }
                fiber.stateNode[key] = fiber.props[key]
            })
        }
        if (fiber.return) {
            let fiberParent = fiber.return
            while (!fiberParent.stateNode) {
                fiberParent = fiberParent.return
            }
            fiberParent.stateNode.appendChild(fiber.stateNode)
        }
    }
    // 初始化 children 的 fiber
    if (fiber.props.children) {
        let prevSibling = null
        // mount 阶段 oldFiber 为空，update 阶段为上一次的值
        let oldFiber = fiber?.alternate?.child
        fiber.props.children.forEach((child, index) => {
            let newFiber = null
            if (!oldFiber) {
                // mount
                newFiber = {
                    type: child.type,
                    stateNode: null,
                    props: child.props,
                    return: fiber,
                    alternate: null,
                    child: null,
                    sibling: null,
                }
            } else {
                // update
                newFiber = {
                    type: child.type,
                    stateNode: oldFiber.stateNode,
                    props: child.props,
                    return: fiber,
                    alternate: oldFiber,
                    child: null,
                    sibling: null,
                }
            }

            if (oldFiber) {
                oldFiber = oldFiber.sibling
            }
            if (index === 0) {
                fiber.child = newFiber
            } else {
                prevSibling.sibling = newFiber
            }
            prevSibling = newFiber
        })
    }
    // 返回下一个要处理的 fiber
    return getNextFiber(fiber)
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
            stateNode: workInProgressRoot.current.container,
            props: workInProgressRoot.current.props,
            alternate: workInProgressRoot.current, // 重要，交换 alternate
        }
        workInProgress = workInProgressRoot.current.alternate
        window.requestIdleCallback(workloop)
    }
    currentHookFiber.memorizedState.push(hook)
    currentHookIndex++
    return [hook.state, setState]
}

export default {
    createElement,
    createRoot,
    act,
    useState,
}