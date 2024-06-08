function performUnitOfWork(fiber) {
    const isFunctionComponent = typeof fiber.type === 'function' && !(fiber.type.prototype instanceof Component);
    const isClassComponent = fiber.type.prototype instanceof Component;

    if (isFunctionComponent) {
        currentHookFiber = fiber;
        currentHookFiber.memorizedState = [];
        currentHookFiber.memorizedEffect = [];
        currentHookIndex = 0;
        currentEffectIndex = 0;
        fiber.props.children = [fiber.type(fiber.props)];
    } else if (isClassComponent) {
        if (!fiber.stateNode) {
            fiber.stateNode = new fiber.type(fiber.props);
            fiber.stateNode.__fiber = fiber;
            fiber.stateNode.componentWillMount();
        }
        fiber.stateNode.props = fiber.props;
        fiber.stateNode.state = fiber.stateNode.state;
        const children = [fiber.stateNode.render()];
        fiber.props.children = children;
    } else {
        if (!fiber.stateNode) {
            fiber.stateNode = fiber.type === 'HostText' ? document.createTextNode('') : document.createElement(fiber.type);
        }
    }

    reconcileChildren(fiber);
    return getNextFiber(fiber);
}


function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    let domParentFiber = fiber.return;
    while (domParentFiber && !domParentFiber.stateNode) {
        domParentFiber = domParentFiber.return;
    }

    const domParent = domParentFiber.stateNode;

    if (fiber.effectTag === 'PLACEMENT' && fiber.stateNode) {
        if (fiber.stateNode instanceof Component) {
            fiber.stateNode.componentDidMount();
        } else {
            updateDom(fiber.stateNode, {}, fiber.props);
            domParent.appendChild(fiber.stateNode);
        }
    } else if (fiber.effectTag === 'UPDATE') {
        if (fiber.stateNode instanceof Component) {
            fiber.stateNode.componentDidUpdate(fiber.alternate.props, fiber.alternate.state);
        } else {
            updateDom(fiber.stateNode, fiber.alternate.props, fiber.props);
        }
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParent);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

class Component {
    constructor(props) {
        this.props = props;
        this.state = this.state || {};
        this.__fiber = null;
    }

    setState(partialState) {
        this.state = { ...this.state, ...partialState };
        rerender();
    }

    // 方便以后扩展生命周期方法
    componentWillMount() {}
    componentDidMount() {}
    componentWillReceiveProps(nextProps) {}
    shouldComponentUpdate(nextProps, nextState) { return true; }
    componentWillUpdate(nextProps, nextState) {}
    componentDidUpdate(prevProps, prevState) {}
    componentWillUnmount() {}
}
