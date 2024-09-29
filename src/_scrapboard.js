
//import { orgData } from './org_strat'
/*
function orgSubmitList(stratTotal, submitList) {
	var userSet = {};
	submitList.map((submit) => {
		var [user, stratId, time] = submit;
		if (userSet[user] === undefined) {
			userSet[user] = Array(stratTotal).fill(null);
		}
		var timeList = userSet[user];
		timeList[stratId] = time;
	});
	return Object.entries(userSet).map((userDat, i) => {
		return {
			name: userDat[0],
			timeList: userDat[1]
		};
	});
}

function StarBoard(props) {
	var stageId = props.stageId;
	var starId = props.starId;
	var starDef = orgData[stageId].starList[starId];
	var colClick = props.colClick;

	// initialize state
	const [userList, setUserList] = useState([]);
	const [userField, setUserField] = useState("");
	const [stratId, setStratId] = useState(0);
	const [timeField, setTimeField] = useState("");
	const [submitList, setSubmitList] = useState([]);

	// build table header
	var stratSet = Object.entries(starDef.jp_set);
	var stratTotal = stratSet.length;
	var tdWidth = "" + Math.floor(85 / stratTotal) + "%";
	var headerElemList = stratSet.map((strat, i) => {
		const [stratName, stratDef] = strat;
		return (<td className="time-cell" key={ stratName } width={ tdWidth }
			onClick={ () => colClick(i + 1) }>{ stratName }</td>);
	});
	headerElemList.unshift(<td key="strat" onClick={ () => colClick(0) }>Strat</td>);

	// build remainder of time table
	var userTimeList = orgSubmitList(stratTotal, submitList);
	var timeElemTable = userTimeList.map((userDat, i) => {
		var timeElemList = userDat.timeList.map((time, i) => {
			return (<td key={ i }>{ time }</td>);
		});
		timeElemList.unshift(<td key="user">{ userDat.name }</td>);
		return (<tr key={ userDat.name }>
			{ timeElemList }
		</tr>);
	});

	// build user options
	var userElemList = userList.map((user) =>
		<option key={ user } value={ user }>{ user }</option>
	);
	userElemList.unshift(<option key="none" value="#none">-</option>)
	userElemList.push(<option key="new" value="#new">NEW</option>);

	// change user function	
	const changeUser = (name) => {
		setUserField("");
		if (name === "#none") {
			props.changeUser(null);
		} else {
			props.changeUser(name);
		}
		if (name !== "#new" && name !== "#none" && !userList.includes(name)) {
			userList.push(name);
			setUserList(userList.concat([]));
		}
	};

	const verifyUser = (name) => {
		setUserField("");
		if (name === "" || name === "#new" || name === "#none") return;
		changeUser(name);
	}

	var userSelect = null;
	if (props.user === '#new') {
		userSelect = <div>
			<input value={ userField } onChange={ (e) => setUserField(e.target.value) }></input>
			<div className="button-group">
				<div className="submit-button" onClick={ () => verifyUser(userField) }>Confirm</div>
				<div className="submit-button" onClick={ () => changeUser("#none") }>X</div>
			</div>
		</div>;
	} else {
		userSelect = <select value={ props.user }
			onChange={ (e) => changeUser(e.target.value) }>{ userElemList }</select>
	}

	// new submission
	const newSubmit = () => {
		submitList.push([props.user, stratId, timeField]);
		setSubmitList(submitList.concat([]));
		setTimeField("");
	};

	// time submission div
	var submitElem = <div></div>;
	if (props.user !== null && props.user !== '#new') {
		var stratElemList = stratSet.map((strat, i) => {
			const [stratName, stratDef] = strat;
			return <option key={ stratName } value={ i }>{ stratName }</option>;
		});
		submitElem = <div className="submit-area">
			<div className="submit-button" onClick={ newSubmit }>Submit</div>
			<select value={ stratId } onChange={ (e) => { setStratId(e.target.value) } }>{ stratElemList }</select>
			<input value={ timeField } onChange={ (e) => { setTimeField(e.target.value) }}></input>
		</div>
	}

	return (
		<div>
		<div className="table-cont">
			<table className="time-table"><tbody>
				<tr className="time-row" key="header">{ headerElemList }</tr>
				{ timeElemTable }
			</tbody></table>
		</div>
		<div className="user-select">
			<p className="prefix">User</p>
			{ userSelect }
		</div>
		{ submitElem }
		</div>
	);
}
*/