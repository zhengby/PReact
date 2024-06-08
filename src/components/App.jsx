import PReact from "../preact06/PReact";
import Display from "./Display";
import ButtonPanel from "./ButtonPanel";
import calculate from "../logic/calculate";
import "./App.css";

export default class App extends PReact.Component {
  constructor(props) {
    super(props)
    this.props = props
  }
  state = {
    total: null,
    next: null,
    operation: null,
  };

  componentDidMount() {
    console.log('App.js mount')
  }

  handleClick = buttonName => {
    this.setState(calculate(this.state, buttonName));
  };

  render() {
    return (
      <div className="component-app">
        <Display value={this.state.next || this.state.total || "0"} />
        <ButtonPanel clickHandler={this.handleClick} />
      </div>
    );
  }
}
