function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => {
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
        setTimeout(() => {
            workloop()
        }, 0);
        // this.renderImpl(this.container, element)
    }
}

function workloop() {
    while (workInProgress) {
        workInProgress = performUnitOfWork(workInProgress)
    }
}

function performUnitOfWork(fiber) {
    console.log('perform ', fiber)
    // 处理当前 fiber，创建 dom 设置属性
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
        fiber.return.stateNode.appendChild(fiber.stateNode)
    }
    // 初始化 children 的 fiber
    if (fiber.props.children) {
        let prevSibling = null
        fiber.props.children.forEach((child, index) => {
            const newFiber = {
                type: child.type,
                stateNode: null,
                props: child.props,
                return: fiber
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

export default {
    createElement,
    createRoot,
}