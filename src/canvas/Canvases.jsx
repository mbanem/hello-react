import React from 'react';

// import { onLoad } from './canvas.jsx';

function Canvases(props) {
	// setTimeout(() => {
	// 	onLoad();
	// 	console.log('setTimeout', 'onLoad');
	// }, 300);
	return (
		<div className="container">
			<canvas id="canvas" width="600" height="400" className="canvas2">
				Your browser does not support the canvas element.
			</canvas>
			<canvas id="canvasDots" width="600" height="400" className="canvas5" />
			<canvas id="canvasGrid" width="600" height="400" className="canvas3" />
			<canvas id="canvasGraph" width="600" height="400" className="canvas2" />
			<canvas id="canvasTopGraph" width="600" height="400" className="canvas4" />
		</div>
	);
}
export default Canvases;
