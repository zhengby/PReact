import { describe, it, expect, vi, } from "vitest";
import PReact from './PReact'

describe('function Component', () => {
    it('should render function Component with props', async () => {
        function App(props) {
            return (
                <div id="test">
                    <h1 className="welcome">{props.title}</h1>
                    <button>add</button>
                    {props.children}
                </div>
            )
        }
        const container = document.createElement('div')
        const dom = (
            <App title={'hello'}>
                <span>inner</span>
            </App>
        )
        const root = PReact.createRoot(container)
        console.log('dom ', dom)
        await PReact.act(() => {
            root.render(dom)
            expect(container.innerHTML).toEqual(``)
        })
        expect(container.innerHTML).toEqual(`<div id="test"><h1 class="welcome">hello</h1><button>add</button><span>inner</span></div>`)
    })

    it('should support useState', async () => {
        const globalObject = {}
        function App(props) {
            const [count, setCount] = PReact.useState(100)
            globalObject.count = count
            globalObject.setCount = setCount
            return (
                <div>
                    {count}
                </div>
            )
        }
        const container = document.createElement('div')
        const root = PReact.createRoot(container)
        await PReact.act(() => {
            root.render(<App />)
        })
        await PReact.act(() => {
            globalObject.setCount(count => count + 1)
        })
        await PReact.act(() => {
            globalObject.setCount(globalObject.count + 1)
        })
        expect(globalObject.count).toBe(102)
    })

    it('should support useReducer', async () => {
        const globalObject = {}
        function reducer(state, action) {
            switch (action.type) {
                case 'add':
                    return state + 1
                case 'sub':
                    return state - 1
            }
        }
        function App(props) {
            const [count, dispatch] = PReact.useReducer(reducer, 100)
            globalObject.count = count
            globalObject.dispatch = dispatch
            return (
                <div>
                    {count}
                </div>
            )
        }
        const container = document.createElement('div')
        const root = PReact.createRoot(container)
        await PReact.act(() => {
            root.render(<App />)
        })
        await PReact.act(() => {
            globalObject.dispatch({ type: 'sub' })
            globalObject.dispatch({ type: 'sub' })
        })
        expect(globalObject.count).toBe(98)
    })

    it('should support eventBinding', async () => {
        const globalObject = {
            increase: (count) => count + 1
        }
        function App(props) {
            const [count, setState] = PReact.useState(100)
            globalObject.count = count
            return (
                <div>
                    <button onClick={() => setState(globalObject.increase)}>
                        {count}
                    </button>
                </div>
            )
        }
        const increaseSpy = vi.spyOn(globalObject, 'increase')
        const container = document.createElement('div')
        const root = PReact.createRoot(container)
        await PReact.act(() => {
            root.render(<App />)
        })
        expect(increaseSpy).not.toBeCalled()
        await PReact.act(() => {
            container.querySelector('button').click()
            container.querySelector('button').click()
        })
        expect(increaseSpy).toBeCalledTimes(2)
        expect(globalObject.count).toBe(102)
    })
})

describe('Reconciler', () => {
    it('should support DOM CRUD', async () => {
        function App() {
            const [count, setCount] = PReact.useState(2)
            return (
                <div>
                    {count}
                    <button onClick={() => setCount(count + 1)}>+</button>
                    <button onClick={() => setCount(count - 1)}>-</button>
                    <ul>
                        {Array(count).fill(1).map((val, index) => {
                            return (
                                <li>{index}</li>
                            )
                        })}
                    </ul>
                </div>
            )
        }
        const container = document.createElement('div')
        const root = PReact.createRoot(container)
        await PReact.act(() => {
            root.render(<App />)
        })
        expect(container.innerHTML).toEqual(`<div>2<button>+</button><button>-</button><ul><li>0</li><li>1</li></ul></div>`)
        await PReact.act(() => {
            container.querySelectorAll('button')[0].click()
        })
        expect(container.innerHTML).toEqual(`<div>3<button>+</button><button>-</button><ul><li>0</li><li>1</li><li>2</li></ul></div>`)
        await PReact.act(() => {
            container.querySelectorAll('button')[1].click()
            // 这里如果连续执行则不会生效，原因是这个时候的 count 还是 3
            // container.querySelectorAll('button')[1].click()
        })
        await PReact.act(() => {
            // 非连续执行，则符合预期
            container.querySelectorAll('button')[1].click()
        })
        expect(container.innerHTML).toEqual(`<div>1<button>+</button><button>-</button><ul><li>0</li></ul></div>`)
    })
})
