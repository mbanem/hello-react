import ReactDOM from 'react-dom';
import React from 'react';
import Canvases from './Canvases';
import './AppCanvas.css';

import {
	changeStudentName,
	toggleGrid,
	toggleRenderPoints,
	renderFuncPoints,
	toggleGraphCanvas,
	onLoad
} from './canvas.jsx';

// CSS file

const pointsStringChanged = () => {
	console.log('pointsStringChanged');
};
const funcExpStringChanged = () => {
	console.log('funcExpStringChanged');
};
// const changeStudent_Name = () => {
// 	console.log('changeStudentName');
// };

function App() {
	setTimeout(() => {
		onLoad();
	}, 400);
	return (
		<React.Fragment>
			<Canvases />>
			<div id="tooltip" className="tooltip" />
			<div className="student-name" onClick={changeStudentName}>
				Marko Milutinovic
			</div>
			<div id="commands" className="commanda" />
			<label htmlFor="pointsList">User defined points</label>
			<br />
			<input
				id="pointsList"
				type="text"
				placeholder="User defined points, like -2,-4 1,1 3,4"
				onChange={pointsStringChanged}
				defaultValue="-16,-6 -3,1 -2,-1 0,-2 1,1 2,-1 3,4 16,7"
			/>
			<input type="checkbox" id="renderPoints" onClick={() => toggleRenderPoints()} />points
			<input
				id="checkboxGrid"
				onClick={() => toggleGrid()}
				onChange={() => {}}
				defaultChecked={true}
				type="checkbox"
			/>grid
			<input type="text" id="twoPoints" />
			<br />
			<span className="line-equation">Line equation</span>
			<p className="p-title">The function equation uses x values entered above to calculate y values</p>
			<input
				id="funcExpression"
				onChange={funcExpStringChanged}
				placeholder="y(x) = x - 1"
				type="text"
				defaultValue="y(x) = Math.sin(x)"
			/>
			<button onClick={() => renderFuncPoints()}>render</button>
			<input type="checkbox" id="funcPoints" onClick={() => toggleGraphCanvas()} />toggle graph
			<div id="gridContainer" className="grid-container" />
			<br />
		</React.Fragment>
	);
}

ReactDOM.render(<App />, document.getElementById('root'));

export default App;
