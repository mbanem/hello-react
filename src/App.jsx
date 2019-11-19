import ReactDOM from 'react-dom'
import React, { useState, Component } from 'react';

// CSS file
import './App.css';

class ReactVersion extends Component {
  render() {
    return (
      <div className="reactVersion">
        Currently using React {React.version}
      </div>
    )
  }
}

class BlogPostExcerpt extends Component {
  render() {
    return (
      <div>
        <h3 className="title" onClick={this.props.s.changeClicked}>
          Change Clicked Color
        </h3>

        <p>
          Name: {this.props.s.Description}
        </p>

        <p className={this.props.s.clickClass}>
          Clicked: {this.props.s.clicked.toString()}
        </p>
        <p className="redFont">
          Current counter value:
          <span className="counter">
            {this.props.s.counter}
          </span>
        </p>
      </div >
    )
  }
}

function Button(props) {
  return (
    <div onClick={props.onCliakHandler} className="incrementButton">
      Click To Increment by {props.increment}
    </div>
  );
}

function Presentation(props) {
  return (
    <li className="red-font">{props.message}</li>
  );
}
// ==========  Currency Converter =============================
// receives no props from parent
class Converter extends Component {
  constructor(props) {
    super(props)
    // my internal state
    this.state = { currency: '€', currencyClass: 'currency-class0' }
  }

  handleChangeCurrency = (event) => {
    this.setState({
      currency: this.state.currency ===
        '€' ? '$' : '€',
      currencyClass: (this.state.currencyClass === 'currency-class0' ? 'currency-class1' : 'currency-class0')
    });
    // console.log('the currency', this.state.currency);
  }

  render() {
    // console.log('render currency', this.state.currency);
    return (
      <div>
        <Display currency={this.state.currency} currencyClass={this.state.currencyClass} />
        {/* give callback reference for handleChangeCurrency to child CurrencySwitcher */}
        <CurrencySwitcher
          // currency={this.state.currency}
          // handleChangeCurrency={this.handleChangeCurrency}
          s={{ currency: this.state.currency, currencyHandler: this.handleChangeCurrency }}
        />
      </div>
    )
  }
}

const CurrencySwitcher = (props) => {
  return (
    <div onClick={props.s.currencyHandler} className="currency">
      Current CURRENCY is {props.s.currency}. Change it!
    </div>
  )
}

const Display = (props) => {
  return (
    <p className={props.currencyClass}>Current Currency is {props.currency}.</p>
  )
}
// ==========  /Currency Converter =============================
function App() {
  const [counter, setCounter] = useState(0);
  // const [currencyClass, setCurrencyClass] = useState('currencyClass0');

  const [clickClass, setClickedClass] = useState('clicked0');
  const incrementCounter = () => {
    setCounter(counter + 1);
    // setCurrencyClass(currencyClass[-1] === '0' ? 'currencyClass1' : 'currencyClass0')
    // // console.log('counter ', counter);
  }

  const [isClicked, setClicked] = useState(false);
  const changeClicked = () => {
    setClicked((isClicked ? false : true));
    setClickedClass(isClicked ? 'clicked0' : 'clicked1');
    // // console.log('clicked', clicked.toString());
  }

  return (
    <div>
      <Button onCliakHandler={incrementCounter} increment={1} />
      <Presentation message={counter} />
      <ReactVersion />
      <BlogPostExcerpt
        s={{              // first curly send non-string; second curly sending an object (could be array [])
          changeClicked,
          clicked: isClicked,
          Description: "Mili Milutinovic",
          counter: counter,
          clickClass: clickClass
        }} />
      <Converter />
    </div>
  );
}

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);

export default App;