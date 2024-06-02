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

class RootElement {
    constructor(container) {
        this.container = container
    }
    renderImpl(parent, element) {
        let ele = element.type === 'HostText' ? document.createTextNode('') : document.createElement(element.type)
        Object.keys(element.props).forEach(key => {
            if (key === 'children') {
                return
            }
            ele[key] = element.props[key]
        })
        if (element.props.children) {
            element.props.children.forEach(child => {
                this.renderImpl(ele, child)
            })
        }
        parent.appendChild(ele)  
    }
    render(element) {
        this.renderImpl(this.container, element)
    }
}

function createRoot(container) {
    return new RootElement(container)
}

export default {
    createElement,
    createRoot,
}