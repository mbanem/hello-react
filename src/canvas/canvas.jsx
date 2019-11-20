let appState = {
	userPointsString: '',
	userPoints: null,
	canvasGeometry: {
		xAxisRange: {
			min: 0,
			max: 0
		},
		gridCellSize: 0, // grid cell size
		OxyTranslated: {
			x: null,
			y: null
		}, // coordinate system begining
		xyPointsRanges: {
			x: {
				min: Infinity,
				max: -Infinity
			},
			y: {
				min: Infinity,
				max: -Infinity
			},
			xMinMax: 0,
			yMinMax: 0
		},
		FyRanges: {
			min: Infinity,
			max: -Infinity,
			yMinMax: 0
		}
	},
	tooltipTimeout: false,
	Fpoints: null,
	gridRendered: false,
	FpointsCalculated: false,
	funcExpression: '', // user entered functoin string def, e.g. y(x) = 2*x*x - 3
	fExpression: null, // compiled string funcExpression above
	fExpressionPoints: null,
	lineParams: '', // keep Ctrl+Click 1st line exp to find cross point with Ctrl+Click 2nd one
	pointsRendered: false,
	graphRendered: false
};
let OxySpan = {
	x: {
		min: null,
		max: null
	},
	y: {
		min: null,
		max: null
	}
};
let ACG = appState.canvasGeometry;
let graphColors = [ 'blue', 'green', 'red', 'magenta', 'navy', 'brown', 'orange' ];
let graphColorsIndex = 0;
let gridContainer;
let canvas, ctx;
let canvasDots, ctxDots;
let canvasGrid, ctxGrid;
let canvasGraph, ctxGraph;
let canvasTopGraph;
let ctxTopGraph;
let commands; // comands div to keep just below canvases dynamically
// let w; // Oxy translate to the right of the canvas left side
// let h; // Oxy translate down from the canvas top side
let W; // canvas full width dynamic
let H; // canvas full hight dynamic
let tooltip; // displays point coordinates on mouse down

// let Fpoints = []; // x coord from userPoints used to calculate user entered func, e.g. y(x) = 2x+1

let marginL = 32; // canvas left margin
let marginT = 16; //canvas top margin

let GRID_COLUMNS = 10;
let checkboxGrid;

// ------- UTILS ------------------------------------------------------------
function el(idStr) {
	let el = document.querySelector(idStr);
	if (idStr.slice(0, 7) === '#canvas') {
		el['id'] = idStr.slice(1);
	}
	return el;
}

function round(num, dec) {
	let fact = Math.pow(10, dec || 0);
	return Math.round(num * fact) / fact;
}
// // creaate an emty object as avariable of a give name
// function namedVar(name) {
// 	eval(name + '={}');
// }
// // turn varible name into  a string
// const varName = (varObj) => Object.keys(varObj)[0];

// function setACG() {
// 	[ ctx, ctxDots, ctxGrid, ctxGraph ].forEach((c) => {
// 		c['AG'] = JSON.parsse(JSON.stringify(ACG));
// 	});
// }
// -------- end UTILS --------------------------------------------------------

// keep xyPointsRanges and FRanges in sync for min and max values, used to render the grid
function adjustRangesAndGridCells(x, y, Y) {
	let rx = ACG.xyPointsRanges.x,
		ry = ACG.xyPointsRanges.y;
	if (rx.min > x) rx.min = x;
	if (rx.max < x) rx.max = x;
	if (ry.min > y) ry.min = y;
	if (ry.max < y) ry.max = y;
	ACG.xyPointsRanges = {
		x: {
			min: rx.min,
			max: rx.max
		},
		y: {
			min: ry.min,
			max: ry.max
		}
	};
}

function adjustGridMesh() {
	// gridCellSize controls grid cell size to accomodate all Fpoints points
	// or userPoints if Fpoints are not rendered
	let cellSize = Math.min(round(W / ACG.xyPointsRanges.xMinMax, 1), round(H / ACG.xyPointsRanges.yMinMax, 1));
	if (appState.FpointsCalculated) {
		// xMinMax is the same as for userPoints as they share x domain
		cellSize = Math.min(cellSize, H / OyRange());
	}
	if (cellSize < 10) {
		cellSize = 10;
	} else if (cellSize > 80) {
		cellSize = 80;
	} else {
		cellSize = Math.floor(cellSize); // whole pixel
	}
	if (ACG.gridCellSize !== cellSize) {
		ACG.gridCellSize = cellSize;

		// divide width and height proportionally with lengths of negative and positive x,y ranges
		ACG.OxyTranslated = {
			x: Math.round(W * Math.abs(ACG.xyPointsRanges.x.min) / ACG.xyPointsRanges.xMinMax),
			// y: Math.round(H * ACG.FyRanges.max / ACG.FyRanges.yMinMax) - cellSize
			y: Math.round(H + (Math.min(ACG.FyRanges.min, ACG.xyPointsRanges.y.min) - 1) * cellSize)
		};
		renderGrid();
		// renderGrid();
		if (ACG.pointsRendered) {
			renderPoints();
		}
		if (ACG.graphRendered) {
			renderFuncPoints();
		}
	}
}

// NOTE: solution from https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
function bezierCurve(points, lineWidth, color, f, step) {
	function gradient(a, b) {
		return (b.y - a.y) / (b.x - a.x);
	}
	// adjustGridMesh();
	let ext = ACG.gridCellSize; //TODO

	function expand(p) {
		return {
			x: ACG.OxyTranslated.x + p.x * ext,
			y: ACG.OxyTranslated.y - p.y * ext
		};
	}
	//	f = 0, will be a straight line
	//	step suppose to be 1, but changing the value can control the smoothness too
	if (typeof f == 'undefined') f = 0.3;
	if (typeof step == 'undefined') step = 1;

	if (!color) {
		color = graphColors[graphColorsIndex++];
		graphColorsIndex = graphColorsIndex % graphColors.length;
	}
	// two cycle rendering, ending fir with ctx.stroke and ctx.beginPath() using black color
	// 1st cycle renders a function graph in blue color
	// 2nd function renders dots over the graph with the hollow inside

	// translateToOxy(ctxGraph); // center graph if Oxy is not centered
	let prevP;
	for (let j = 0; j < 2; j++) {
		ctxGraph.strokeStyle = color || 'black';
		ctxGraph.lineWidth = lineWidth || 1;
		// set line params for the second loop
		if (j === 1) {
			ctxGraph.stroke();
			ctxGraph.beginPath();
			ctxGraph.strokeStyle = 'black';
			ctxGraph.lineWidth = 1;
		}
		// moveTo will abandons the previous rendering and will not close the curve
		// as it would if we do not start with ctxGraph.moveTo -- meaning it is a new beginning
		prevP = expand(points[0]);
		ctxGraph.moveTo(prevP.x, prevP.y);
		let grad = 0;
		let dx1 = 0,
			dx2 = 0;
		let dy1 = 0,
			dy2 = 0;
		let nextP;
		let psize = points.length;
		for (let i = 1; i < psize; i++) {
			try {
				let P = expand(points[i]); // P is a curent point
				if (i + 1 < psize) {
					nextP = expand(points[i + 1]);
				}
				if (nextP) {
					grad = gradient(prevP, nextP);
					dx2 = (nextP.x - P.x) * -f;
					dy2 = dx2 * grad * step;
				} else {
					dx2 = 0;
					dy2 = 0;
				}
				if (j === 1) {
					renderDot(ctxGraph, prevP, 0);
				} else {
					ctxGraph.bezierCurveTo(prevP.x - dx1, prevP.y - dy1, P.x + dx2, P.y + dy2, P.x, P.y);
				}
				dx1 = dx2;
				dy1 = dy2;
				prevP = P;
			} catch (e) {
				console.log('bezier loop: , e');
			}
		}
	}
	renderDot(ctxGraph, prevP, 0);
	//ctxGraph.arc(prevP.x, prevP.y, 2, 0, 2 * Math.PI);
	ctxGraph.stroke();
	ctxGraph.save();
}

export const changeStudentName = () => {
	let sn = el('.student-name');
	let marko = sn.innerText[1] === 'a';
	sn.innerText = marko ? 'Mia Milutinovic' : 'Marko Milutinovic';
	sn.classList.toggle('mia');
};

function functionChanged() {
	let changed = appState.funcExpression.replace(/\s+/g, '') !== el('#funcExpression').value.replace(/\s+/g, '');
	if (changed) {
		appState.FpointsCalculated = false;
		appState.Fpoints = null;
	}
	return changed;
}

// for a given string expression, e.g. y(x) = 2(3x-4) return compiled expression for
// evaluating function value for a given x variable value
function funcExpression(str) {
	if (!str) {
		str = appState.funcExpression = el('#funcExpression').value;
	}
	if (!str) {
		return null;
	}
	let fExpression;
	let funcStr = str.split('=')[1]; // handle only right part, as formula should be y(x) = expression
	// turn 2x --> 2*x and 2(x+1) --> 2*(2+1)
	funcStr = funcStr.replace(/(\d+)x/g, '$1*x').replace(/(\d+)\(/g, '$1*(').replace(/xx/g, 'x*x');

	try {
		fExpression = (x) => {
			return eval(funcStr);
		};
	} catch (e) {
		return alert('Function expression is incorrect\nplease correct.');
	}
	return (appState.fExpression = fExpression);
	// return fExpression;
}

function funcExpressionPoints() {
	const points = [];
	let x = OxySpan.x.min;
	let y = OxySpan.y;
	funcExpression();
	const fexp = appState.fExpression;
	while (x <= OxySpan.x.max) {
		let fval = round(fexp(x), 3);
		if (fval >= y.min && fval <= y.max) {
			points.push({
				x: x,
				y: fval
			});
		}
		x += 0.1;
	}
	return (appState.fExpressionPoints = points);
}

// points are not calculated for displaying in canvas, that is job of renderings
function getPoints(fExpression) {
	let upl = el('#pointsList').value;
	if (upl === appState.userPointsString && appState.FpointsCalculated) {
		// no changes in user points input string
		return;
	}
	appState.pointsRendered = false;
	if (!fExpression) {
		appState.fExpression = funcExpression();
	}

	let plist = upl.split(' ');
	const points = [];

	let error;
	appState.Fpoints = [];
	for (let i = 0; i < plist.length; i++) {
		let [ x, y ] = plist[i].split(',');
		let Y = null;
		// do not change point coordinates that user entered in points box
		points.push({
			x: +x,
			y: +y
		});

		// but calculate function value on x and punt it into Fpoints
		if (appState.fExpression) {
			try {
				Y = round(appState.fExpression(x), 2);
			} catch (e) {
				error = true;
			}

			appState.Fpoints.push({
				x: +x,
				y: +Y
			});
		}
		// test min-max for current point and its
		adjustRangesAndGridCells(+x, +y, Y);
	}
	setFyRanges(appState.fExpression);
	appState.userPoints = points;
	let r = ACG.xyPointsRanges;
	r.xMinMax = round(+r.x.max - +r.x.min, 2);
	r.yMinMax = round(+r.y.max - +r.y.min, 2);
	// now for function values range
	r = ACG.FyRanges;
	r.yMinMax = round(r.max - r.min, 2);
	if (appState.fExpression) {
		// appState.Fpoints = Fpoints;
		appState.FpointsCalculated = true;
	}
	if (error) {
		console.log('fExpression calculation failed');
		return;
	}
	appState.userPointsString = upl;
	adjustGridMesh();

	return appState.userPoints;
}

function isOutsideOfCanvas(evt) {
	// return false;
	let x = evt.clientX - marginL - window.scrollX;
	let y = evt.clientY - marginT + window.scrollY;
	return x <= 0 || x > W || y <= 0 || y > H;
}

export const onLoad = () => {
	console.log(onLoad);
	canvas = el('#canvas');
	canvasDots = el('#canvasDots');
	canvasGrid = el('#canvasGrid');
	canvasGraph = el('#canvasGraph');
	canvasTopGraph = el('#canvasTopGraph');
	ctx = canvas.getContext('2d');
	ctxDots = canvasDots.getContext('2d');
	ctxGrid = canvasGrid.getContext('2d');
	ctxGraph = canvasGraph.getContext('2d');
	ctxTopGraph = canvasTopGraph.getContext('2d');
	ctxGraph['tooltips'] = [];
	[ canvas, canvasDots, canvasGrid, canvasGraph, canvasTopGraph ].forEach((c, ix, arr) => {
		c.width = window.innerWidth - 2 * marginL;
		c.height = window.innerHeight;
		c.style.left = `${marginL}px`;
		c.style.top = `${marginT}px`;
		c.style.opacity = '1';
		// canvas and its ctx have the same id : canvasGraph.id. ctxGraph.id --> 'canvasGraph'
	});
	[ ctx, ctxDots, ctxGrid, ctxGraph ].forEach((c) => {
		c.lineWidth = 1;
	});
	canvasTopGraph.style.opacity = '0';
	W = canvas.width;
	H = canvas.height;

	// w = Math.round(canvas.width / 2); // initially before user points and function points are accuired
	// h = Math.round(canvas.height / 2);
	// ACG.gridCellSize = Math.round(h / 20);

	checkboxGrid = el('#checkboxGrid');
	commands = el('#commands');

	getPoints();
	onResizeWindow();

	tooltip = el('#tooltip');
	gridContainer = el('#gridContainer');
	gridContainer.addEventListener('click', renderFuncPointOrGraph);

	// el('#canvasGrid').addEventListener("mousedown", showCoordinates);
	// el('#canvasGrid').addEventListener("mouseup", hideCoordinates);
	document.body.addEventListener('mousedown', showCoordinates);
	document.body.addEventListener('mouseup', hideCoordinates);
	window.addEventListener('resize', onResizeWindow);

	// renderOxy();
	// appState.actions.renderOxy = renderOxy;
	if (checkboxGrid.checked) {
		renderGrid();
	}
	// ctx.fillStyle = 'green';
	// // font: bold italic 15px/20px arial,sans-serif;
	// ctx.font = 'normal italic 16px/16px Georgia';
	// ctx.fillText('Marko Milutinovic', 20, 15);
};

function onResizeWindow(evt) {
	[ canvas, canvasDots, canvasGrid, canvasGraph ].forEach((c) => {
		c.width = Math.round(window.innerWidth - 2 * marginL);
		c.height = Math.round(window.innerHeight);
		c.style.left = `${marginL}px`;
		c.style.top = `${marginT}px`;
	});

	W = canvas.width;
	H = canvas.height;

	// w = Math.round(canvas.width / 2); // initially before user points and function points are accuired
	// h = Math.round(canvas.height / 2);

	if (appState.userPoints && userPointStringChanged()) {
		// if points entered we should adjust gridd cells for new Oxy range
		adjustGridMesh();
	}
	// else {
	// 	ACG.gridCellSize = Math.round(canvas.width / 60); // initial only
	// }

	// move commands part below the canvas
	commands.style.top = `${H + marginT}px`;
	commands.style.left = `${marginL}px`;
	commands.style.width = `${W}px`;
}

function OyRange() {
	let oyRange = Math.floor(ACG.FyRanges.max - Math.min(ACG.xyPointsRanges.x.min, ACG.FyRanges.min));
	return oyRange;
}

function renderDot(ctx, prevP, d) {
	d = d === undefined ? 2 : d;
	ctx.beginPath();
	ctx.translate(-0.5, -0.5);
	ctx.arc(prevP.x, prevP.y, d, 0, 2 * Math.PI);
	ctx.fillStyle = 'white';
	ctx.fill();
	ctx.translate(0.5, 0.5);
	ctx.stroke();
}

// render points for a function taking x-coordinate from user defined points
// and caculate y-coordinate by getting compiled function expression from user
// entered string, e.g. y(x) 2*x - 4
export const renderFuncPoints = () => {
	let funcChanged = functionChanged();
	if (!userPointStringChanged() && !funcChanged) {
		toggleGraphCanvas(true);
		if (appState.graphRendered) {
			return;
		}
	}
	let str = ''; // hold all points(x,y(x)) as <div> content to insert into grid
	// let val; // eval of the right side expression

	// if (funcChanged || !appState.FpointsCalculated) {
	// 	let fexp = funcExpression();
	// 	if (!fexp) {
	// 		return;
	// 	}
	// 	getPoints(fexp); // fills both userPoints and Fpoints
	// }

	// F = []; // array of point objects, e.g. [ {x:x, y:y}, {x:x, y:y} ...]
	if (!appState.fExpressionPoints) {
		funcExpressionPoints();
	}
	for (let i = 0; i < appState.fExpressionPoints.length; i++) {
		str += `<div>(${appState.fExpressionPoints[i].x}, ${appState.fExpressionPoints[i].y})</div>`;
	}
	setGridTemplates();
	gridContainer.innerHTML =
		`<div class="header">Function ${appState.funcExpression} contains the following points</div>` + str;

	// renderPolygon(appState.Fpoints);
	// canvasGraph.clearRect(0, 0, W, H);

	// render function from OxyRange.x.min to OxyRange.x.max based on appState.funcExpression
	bezierCurve(funcExpressionPoints());
	// bezierCurve(appState.Fpoints, 1, 'blue');
	// bezierCurve(appState.Fpoints);
	if (!canvasGraph.style.opacity) {
		canvasGraph.style.opacity = 1;
	}
	if (!gridContainer.style.opacity) {
		gridContainer.style.opacity = '1';
	}
	toggleGraphCanvas(true);
	appState.graphRendered = true;
};

// onclick over (x, y) coordinate pair displayed for function graph coordinates
function renderFuncPointOrGraph(evt) {
	let str = evt.target.innerText;
	let m;
	if (str.match(/\s*Function/)) {
		canvasTopGraph.style.opacity = canvasTopGraph.style.opacity === '0' ? '1' : '0';
		renderFuncPolygon(appState.Fpoints, 10, 'yellow', 'destination-over', ctxTopGraph);
	} else if ((m = str.match(/\s*(-?[0-9.]+)/g))) {
		// let xy = str.replace(/[()]/g, '').split(',');
		ctxGraph.globalCompositeOperation = 'source-over';
		renderPoints(
			4,
			'blue',
			2,
			[
				{
					x: +m[0],
					y: +m[1]
				}
			],
			ctxGraph
		);
	}
}

// expands coordinate by gridCellSize
// uses gco: globalCompositeOperation
function renderFuncPolygon(points, lineWidth, color, gco, ctxTop) {
	let pts = [];
	for (let i = 0; i < points.length; i++) {
		pts.push({
			x: ACG.OxyTranslated.x + points[i].x * ACG.gridCellSize,
			y: ACG.OxyTranslated.y - points[i].y * ACG.gridCellSize
		});
	}
	renderPixelPolygon(ctxTop || ctxGraph, pts, lineWidth, color, gco);
}

function renderGrid() {
	renderOxy();
	ctxGrid.clearRect(0, 0, W, H);
	let celldim = ACG.gridCellSize;

	// let hLines = Math.round(H / celldim);
	ctxGrid.beginPath();
	ctxGrid.strokeStyle = 'lightgray';

	let HH = H - 20; // for grid vertical lines bottom Y coordinate
	let WW = W - 20; // for grid horizontal lines right end X coordinate
	let tx = ACG.OxyTranslated.x, // Oy position from the left
		ty = ACG.OxyTranslated.y; // Ox position from top

	ctxGrid.font = '12px serif';
	ctxGrid.fillStyle = 'black';

	// vertical line right of Oy axis
	let vRLines = Math.round((W - tx) / celldim);
	OxySpan.x.max = vRLines - 1;
	ACG.xAxisRange.max = vRLines - 1;
	for (let i = 1; i < vRLines; i++) {
		ctxGrid.moveTo(tx + i * celldim, 20);
		ctxGrid.lineTo(tx + i * celldim, HH);
		if (i < vRLines - 1) {
			ctxGrid.fillText(i, tx + i * celldim + 1, ty + 12);
		}
	}

	ctxGrid.fillText(0, tx + 1, ty + 12);

	// vertical line left of Oy axis
	let vLLines = Math.round(tx / celldim);
	OxySpan.x.min = -vLLines + 1;
	ACG.xAxisRange.min = -vLLines;

	for (let i = 1; i < vLLines; i++) {
		ctxGrid.moveTo(tx - i * celldim, 20);
		ctxGrid.lineTo(tx - i * celldim, HH);

		ctxGrid.fillText(-i, tx - i * celldim + 1, ty + 12);
	}

	// horizontal top horizontal lines above Ox axis
	let hTLines = Math.round(ty / celldim); // # of horizontal top lines
	OxySpan.y.max = hTLines - 1;
	for (let i = 1; i < hTLines; i++) {
		// above the Ox axis
		ctxGrid.moveTo(20, ty - i * celldim);
		ctxGrid.lineTo(WW, ty - i * celldim);

		ctxGrid.fillText(i, tx + 5, ty - i * celldim + 6);
	}
	// horizontal lines below the Ox axis
	let hBLines = Math.round((H - ty) / celldim); // # of horizontal top lines
	OxySpan.y.min = -hBLines + 1;
	for (let i = 1; i <= hBLines; i++) {
		// above the Ox axis
		ctxGrid.moveTo(20, ty + i * celldim);
		ctxGrid.lineTo(WW, ty + i * celldim);

		ctxGrid.fillText(-i, tx + 5, ty + i * celldim + 6);
	}
	ctxGrid.stroke();
	appState.gridRendered = true;
	toggleGrid();
	// appState.actions.renderGrid = renderGrid;
}

// first point's [k,b] is held in appState.lineParams
function renderLinesCrossPoint(k2, b2, funcExp, evt) {
	let [ k1, b1 ] = appState.lineParams;
	if (k1 === k2) {
		return;
	}
	// solutin for from y1(x)=y2(x) => k1*x + b1 = k2*x +b2 => x=(b2-b1)/(k1-k2);
	let x = round((b2 - b1) / (k1 - k2), 4);
	let y = round(funcExp(x), 4);

	renderPoints(
		3,
		'red',
		3,
		[
			{
				x: x,
				y: y
			}
		],
		ctxGraph
	);
	let cellSize = ACG.gridCellSize;
	let t = ACG.OxyTranslated;
	let tleft = round(x * cellSize + t.x, 1) + 40;
	let ttop = round(t.y - y * cellSize, 1) - 10;
	let ttip = tooltip.cloneNode(true);
	ctxGraph.tooltips.push(ttip);
	document.body.appendChild(ttip);
	ttip.style.left = `${tleft}px`;
	ttip.style.top = `${ttop}px`;
	// get discrepancy when using evt.clientY - h - marginT
	ttip.innerHTML = `<span style='font-size:14px;color:yellow'>X(${x}, ${y})</span>`;
	// <span style='font-size:10px;color:yellow'> &nbsp; (${tleft}, ${ttop})</span>`;
	console.log(`x=${x}`);
	console.log(`1st line: y(${x}) = ${k1}*${x} + ${b1} = ${round(k1 * x + b1, 4)}`);
	console.log(`2nd line: y(${x}) = ${k2}*${x} + ${b2} = ${round(k2 * x + b2, 4)}`);
	ttip.style.opacity = '1'; // make ttip visible
	ttip['permanent'] = true;
}

// render line accross the whole canvas through points selected by Ctrl+Click
function renderLineByTwoPoints(x, y) {
	let elval = el('#twoPoints').value;
	// if (elval.split('(').length > 2) {
	// extract left and right part to get '(x1,y1' and 'x2,y2)' with half parentheses
	let pts = el('#twoPoints').value.replace(/\s{2,}/g, ' ').split(') (');
	// extract x,y coordinates by destructuring splitted values
	let [ x1, y1 ] = pts[0].replace(/[()]/g, '').split(',');
	let [ x2, y2 ] = pts[1].replace(/[()]/g, '').split(',');

	// x1,y2 and x2,y2 are still strings
	let k = round((y2 - y1) / (x2 - x1), 3);
	let b = round(y2 - k * x2, 3);
	let sgn = b > 0 ? '+' : '';
	let rhs = `${k}*x ${sgn} ${b}`;
	if (!b) {
		b = '+';
	}
	// get functin expression for linear fuction
	let fexpr = funcExpression(`y(x) = ${rhs}`);

	el(
		'.line-equation'
	).innerHTML += `<br><span style='margin-left:1rem;color:blue'>${elval} equation: y(x) = ${rhs}</span>`;

	// ACG.xAxisRange holds the range of Ox axis to allow the line
	// to take values over the whole range and render accross the whole canvas
	let rx = ACG.xAxisRange;
	let points = [
		{
			x: rx.min,
			y: round(fexpr(rx.min), 2)
		},
		{
			x: rx.max,
			y: round(fexpr(rx.max), 2)
		}
	];
	// rendering line througn two given points
	bezierCurve(points, 1, 'green', 0, 1);

	if (appState.lineParams) {
		// inclination k and y=y(0) Oy cross point
		renderLinesCrossPoint(k, b, fexpr);
		appState.lineParams = '';
		el('#twoPoints').value = '';
	}
	appState.lineParams = [ k, b ];
	// }
}

function renderOxy() {
	// translateToOxy(ctx);
	if (ACG.OxyTranslated.x == null) {
		adjustGridMesh();
	}
	let Ox = ACG.OxyTranslated.x;
	let Oy = ACG.OxyTranslated.y;

	let oy = [
		{
			x: Ox,
			y: 0
		},
		{
			x: Ox + 4,
			y: 8
		},
		{
			x: Ox - 4,
			y: 8
		},
		{
			x: Ox,
			y: 0
		},
		{
			x: Ox,
			y: H
		}
	];
	// horizontal grid lines
	let ox = [
		{
			x: 0,
			y: Oy
		},
		{
			x: W,
			y: Oy
		},
		{
			x: W - 8,
			y: Oy + 4
		},
		{
			x: W - 8,
			y: Oy - 4
		},
		{
			x: W,
			y: Oy
		}
	];

	ctx.clearRect(0, 0, W, H);
	// to accept a new color
	ctx.beginPath();
	ctx.strokeStyle = 'gray';
	ctx.translate(0.5, 0.5);
	renderPixelPolygon(ctx, oy);
	// ctxDots.beginPath();
	// ctxDots.moveTo(3000, 3000);
	// ctxDots.lineTo(3001, 3000);
	// ctxDots.stroke();
	renderPixelPolygon(ctx, ox);

	// ctx.moveTo(w, h);
	// ctx.arc(w, Oy, 2, 0, 2 * Math.PI);
	// ctx.stroke();
	ctx.font = '20px serif';
	ctx.fillStyle = 'gray';
	ctx.fillText('O', Ox - 25, Oy + 20); // render O for Oxy
	ctx.fillText('y', Ox + 10, marginT); // render y for Oxy
	ctx.fillText('x', W - 20, Oy + 16); // render x for Oxy

	canvasGrid.style.opacity = checkboxGrid.checked ? '1' : '0';
	ctx.stroke();
}

// canvas is prone to misguiding position when translateToOxy is
// called more than once. It applies translate over and over
// so canvas got 'translated' flag to allow only single translate
// so for new kind of translate the flag shoud be cleared, i.e. set to false
function renderPoints(diameter, color, lineWidth, points, ctx) {
	ctx = ctx || ctxGraph;
	ctx.globalCompositeOperation = 'source-over';
	let celldim = ACG.gridCellSize;
	if (!points) {
		points = appState.userPoints || getPoints();
	}
	ctx.beginPath();
	ctx.strokeStyle = color || '#ff0000';
	ctx.lineWidth = lineWidth || 2;

	for (let i = 0; i < points.length; i++) {
		let [ x, y ] = [ ACG.OxyTranslated.x + points[i].x * celldim, ACG.OxyTranslated.y - points[i].y * celldim ];
		ctx.moveTo(x, y);
		ctx.arc(x, y, diameter || 2, 0, 2 * Math.PI);
	}
	ctx.stroke();
	if (canvasGraph.style.opacity !== '1') {
		canvasGraph.style.opacity = 11;
	}
}

// uses coordinates that has to be scalled to pixels to render in canvas
// function renderPolygon(points) {
// 	ctxGraph.clearRect(0, 0, W, H);
// 	let celldim = appState.gridCellSize;
// 	ctxGraph.beginPath();
// 	ctxGraph.moveTo(points[0].x * celldim, points[0].y * celldim);
// 	for (let i = 0; i < 5; i++) {
// 		//points.length; i++) {
// 		ctxGraph.lineTo(w + points[i].x * celldim, h - points[i].y * celldim);
// 	}
// 	ctxGraph.stroke();
// }

// uses ready calculated pixel positon to render polygon, no scaling needed
// uses gco: globalCompositeOperation
function renderPixelPolygon(ctx, points, lineWidth, color, gco) {
	// translateToOxy(ctx);
	ctx.beginPath();
	ctx.lineWidth = lineWidth || 1;
	ctx.strokeStyle = color || 'black';
	if (gco) {
		ctx.globalCompositeOperation = gco;
	}
	ctx.moveTo(points[0].x, points[0].y);
	for (let i = 0; i < points.length; i++) {
		ctx.lineTo(points[i].x, points[i].y);
	}
	ctx.stroke();
}

export const toggleGraphCanvas = (vboolean) => {
	if (vboolean === undefined) {
		// if checkbox event was raised
		vboolean = el('#funcPoints').checked;
	} else {
		el('#funcPoints').checked = vboolean;
	}
	canvasGraph.style.opacity = gridContainer.style.opacity = vboolean ? 1 : 0;
	ctxGraph.tooltips.forEach((tt) => {
		tt.style.opacity = vboolean ? 1 : 0;
	});
};

export const toggleGrid = () => {
	let style = el('#canvasGrid').style;
	if (checkboxGrid.checked) {
		if (!appState.gridRendered && appState.userPoints) {
			renderGrid();
		}
		style.opacity = '1';
	} else {
		style.opacity = '0';
	}
};

// by pressing the points button, so here we collect the points
export const toggleRenderPoints = (diameter, color, lineWidth) => {
	let cbox = el('#renderPoints');
	if (cbox.checked) {
		if (!appState.pointsRendered || userPointStringChanged()) {
			renderPoints(diameter, color, lineWidth, null, ctxDots);
			appState.pointsRendered = true;
		}
		canvasDots.style.opacity = '1';
	} else {
		canvasDots.style.opacity = '0';
	}
};

// function translateToOxy(ctx) {
// 	// return;
// 	if (ctx['translated'] || ACG.OxyTranslated.x == null) {
// 		return;
// 	}
// 	ctx.translate(ACG.OxyTranslated.x - W / 2, ACG.OxyTranslated.y - H / 2);
// 	ctx['translated'] = true;
// }

function setFyRanges(fExpression) {
	ACG.FyRanges = {
		min: Infinity,
		max: -Infinity,
		yMinMax: 0
	};
	let x = ACG.xyPointsRanges.x.min;
	let delta = (ACG.xyPointsRanges.x.max - ACG.xyPointsRanges.x.min) / 20;
	let y;
	for (let i = 0; i < 20; i++) {
		y = fExpression(x);
		if (ACG.FyRanges.min > y) {
			ACG.FyRanges.min = y;
		}
		if (ACG.FyRanges.max < y) {
			ACG.FyRanges.max = y;
		}
		x += delta;
	}
	ACG.FyRanges.yMinMax = ACG.FyRanges.max - ACG.FyRanges.min;
}

// mousedown and hold on a canvas grid we display point coordinates in a tooltip like pill
function showCoordinates(evt) {
	if (isOutsideOfCanvas(evt)) {
		return;
	}
	let delta = 0.3;
	// set tooltip on the right of the mousedown point
	let cellSize = ACG.gridCellSize;

	let x = round((evt.clientX - ACG.OxyTranslated.x - canvas.offsetLeft + window.scrollX) / cellSize, 1);
	let y = -round((evt.clientY - ACG.OxyTranslated.y - canvas.offsetTop + window.scrollY) / cellSize, 1);
	tooltip.style.backgroundColor = 'navy';
	for (let i = 0; i < appState.userPoints.length; i++) {
		let p = appState.userPoints[i];
		if (Math.abs(Math.abs(x) - Math.abs(p.x)) < delta && Math.abs(Math.abs(y) - Math.abs(p.y)) < delta) {
			setTooltip(p.x, p.y, evt, 2000);
			return;
		}
	}
	if (evt.ctrlKey) {
		el('#funcPoints').checked = true;

		renderPoints(
			3,
			'green',
			3,
			[
				{
					x: x,
					y: y
				}
			],
			ctxGraph
		);

		// enter selected point into input field and when it gets two points
		// render a line through them
		if (el('#twoPoints').value.split('(').length === 2) {
			el('#twoPoints').value += `( ${x}, ${y}) `;
			renderLineByTwoPoints(x, y, evt);
		} else {
			//if (el('#twoPoints').value.split('(').length < 2) {
			el('#twoPoints').value = `( ${x}, ${y}) `;
		}
	} else {
		setTooltip(x, y, evt);
	}
}

// if user changed input points everything should be adjusted, shrinked or expanded
function userPointStringChanged() {
	if (appState.userPointsString !== el('#pointsList').value) {
		getPoints();
		return true;
	}
	return false;
}

// // to show point coordinates we mousedown and hold n canvas but resolve values up to .5
// function roundTo05(x) {
// 	let delta = 0;
// 	let rest = (x - Math.floor(x)) % 10;
// 	if (rest > 0.7) {
// 		delta = 1;
// 	} else if (rest > 0.3) {
// 		delta = 0.5;
// 	}
// 	x = Math.floor(x) + delta;
// 	return x;
// }

function setTooltip(x, y, evt, time) {
	tooltip.style.left = `${evt.clientX + marginL - window.scrollX}px`;
	tooltip.style.top = `${evt.clientY - marginT + window.scrollY}px`;
	// get discrepancy when using evt.clientY - h - marginT
	tooltip.innerHTML = `P(${x}, ${y})</span>`;
	tooltip.style.backgroundColor = time ? 'red' : 'navy';
	// <span style='font-size:10px;color:yellow'> &nbsp; (${evt.clientX}, ${evt.clientY})  cell ${ACG.gridCellSize}</span>`;

	if (time) {
		appState.tooltipTimeout = true;
		setTimeout(() => {
			tooltip.style.opacity = '0';
			appState.tooltipTimeout = false;
			tooltip.style.backgroundColor = 'navy';
		}, time);
	}
	tooltip.style.opacity = '1'; // make tooltip visible
}

function hideCoordinates(evt) {
	if (tooltip['permanent'] || appState.tooltipTimeout) {
		return;
	}
	tooltip.style.opacity = '0';
}

// when definind grid-template-columns: 1fr 1fr 1fr
// and dynamic number of rows based on number of points that user specified
// grid-termplate-rows: auto auto auto ...
function repeate(str, num) {
	let s = '';
	for (let i = 0; i < num; i++) {
		s += str;
	}
	return s;
}

// show function points (x, f(x)) in GRID_COLUMNS columns and calculate
// how many rows are necessary to dipsplay all the points
function setGridTemplates() {
	let gridStyle = gridContainer.style;
	gridStyle.gridTemplateColumns = repeate('1fr ', GRID_COLUMNS);
	gridStyle.gridTemplateRows = repeate('auto ', 1 + Math.ceil(funcExpressionPoints.length / GRID_COLUMNS));
}
