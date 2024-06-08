import PReact from "../preact06/PReact"
// import PropTypes from "prop-types";

import "./Display.css";

export default class Display extends PReact.Component {
//   static propTypes = {
//     value: PropTypes.string,
//   };
  constructor(props) {
    super(props)
    this.props = props
  }

  componentDidMount() {
    console.log('Display.js mount')
  }

  render() {
    return (
      <div className="component-display">
        <div>{this.props.value}</div>
      </div>
    );
  }
}
