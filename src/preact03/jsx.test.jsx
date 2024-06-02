import { describe, it, expect } from "vitest";
import PReact from './PReact'

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

describe("Test jsx ", () => {
    it('should render in async', async () => {
        const dom = (
            <div id="test">
                <h1 className="welcome">hi</h1>
                <button>add</button>
            </div>
        )
        console.log(JSON.stringify(dom))
        const container = document.createElement('div')
        const root = PReact.createRoot(container)
        await PReact.act(() => {
            root.render(dom)
            expect(container.innerHTML).toEqual(``)
        })
        expect(container.innerHTML).toEqual(`<div id="test"><h1 class="welcome">hi</h1><button>add</button></div>`)
    })
})