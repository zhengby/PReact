import { describe, it, expect, } from "vitest";
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

    it.only('should support useState', async () => {
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
})