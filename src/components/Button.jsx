import PReact from "../preact06/PReact"
// import PropTypes from "prop-types";
import "./Button.css";

export default class Button extends PReact.Component {
    constructor(props) {
        super(props)
        this.props = props
      }
//   static propTypes = {
//     name: PropTypes.string,
//     orange: PropTypes.bool,
//     wide: PropTypes.bool,
//     clickHandler: PropTypes.func,
//   };
    componentDidMount() {
      console.log('button js mount')
    }

  handleClick = () => {
    this.props.clickHandler(this.props.name);
  };

  render() {
    const className = [
      "component-button",
      this.props.orange ? "orange" : "",
      this.props.wide ? "wide" : "",
    ];

    return (
      <div className={className.join(" ").trim()}>
        <button onClick={this.handleClick}>{this.props.name}</button>
      </div>
    );
  }
}
