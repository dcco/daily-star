import React, { useState } from 'react'

import playData from './json/player_data.json'
import { formatTime, formatMultiDat, newVerOffset } from "./time_dat"
import { sortTimeTable } from "./time_table"
import { nameListMergeView, recordListMergeView, filterTableMergeView } from "./merge_view"

	/*
		##########
		STAR TABLE
		##########
		react element designed to display timetable information
		+ optionally provides hooks to modify timetable info
	*/

	// generic data structure functions

function updateArray(a, i, v) {
	return a.map((old, j) => (i === j) ? v : old);
}

	// time manipulation

function validName(s) {
	return s.match(/^[a-zA-Z0-9 _]+$/) !== null;
}

function validTime(s) {
	return s.match(/^([0-9]?[0-9]:)?[0-5]?[0-9](\.[0-9][036]?)?$/) !== null;
}

function validEdit(cellText) {
	// valid player name
	if (!validName(cellText[0])) return false;
	// all times are valid, and at least one change has been made
	var isDirty = false;
	for (let i = 1; i < cellText.length; i++) {
		if (cellText[i] !== "") {
			if (!validTime(cellText[i])) return false;
			isDirty = true;
		}
	}
	return isDirty;
}

function RawCell(props, cellText, exText) {
	var active = props.active;
	var onClick = props.onClick;
	var multiFlag = props.multiFlag;
	var mainNode = cellText;
	if (exText !== null) {
		mainNode = (<span>{ cellText } <em>{ exText }</em></span>);
	}
	var eeText = "";
	if (multiFlag) eeText = "*";
	return (<td className="time-cell" active={ active.toString() } onClick={ onClick }>{ mainNode } { eeText }</td>);
}

function TimeCell(props) {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	// -- these properties are present, but used in raw cell
	// var active = props.active;
	// var onClick = props.onClick;
	// var multiFlag = props.multiFlag;
	// null case
	if (timeDat === null) return RawCell(props, "", null);
	var cellText = formatTime(timeDat.time);
	// variant text
	if (timeDat.rowDef.variant_list.length > 0) {
		cellText = cellText + " [";
		timeDat.rowDef.variant_list.map((v, i) => {
			if (i !== 0) cellText = cellText + ",";
			var vpp = parseInt(v) + 1;
			cellText = cellText + vpp;
		})
		cellText = cellText + "]";
	}
	// if the version matters
	var exText = null;
	if ((verOffset.focusVer === "jp" && timeDat.rowDef.ver === "us") ||
		(verOffset.focusVer === "us" && timeDat.rowDef.ver === "jp")) {
		exText = verAdjustTime(timeDat.rowDef.ver, timeDat.rawTime, timeDat.time);
	//(<span>{ linkText } <em>
	//		{ verAdjustTime(timeDat.rowDef.ver, timeDat.rawTime, timeDat.time) }</em></span>);
	}
	// link if link is relevant
	if (timeDat.link !== null) {
		cellText = (<a href={ timeDat.link }>{ cellText }</a>);
	}
	return RawCell(props, cellText, exText)
}

function NameCell(props) {
	// get play standard when applicable
	var playStd = "Unranked";
	if (playData[props.name] !== undefined && playData[props.name].standard) {
		playStd = playData[props.name].standard;
	}
	// name + ending cell
	return(<td ps={ playStd }>{ props.name }</td>);
}

function DataRow(props) {
	var userDat = props.userDat;
	var verOffset = props.verOffset;
	var action = props.action;
	var rowId = props.rowId;
	var onClick = props.onClick;
	var datarow = props.datarow;
	// get text for initializing edit row
	var timeText = userDat.timeRow.map(formatMultiDat);
	timeText.unshift(userDat.name);
	// active (clickable)
	var active = (action !== "none");
	// build time cells
	var timeRowNodes = userDat.timeRow.map((multiDat, j) => {
		// get representative time cell
		var timeDat = null;
		var multiFlag = false;
		if (multiDat !== null) {
			timeDat = multiDat[0];
			multiFlag = multiDat.length > 1;
		}
		return <TimeCell timeDat={ timeDat } verOffset={ verOffset } active={ active }
			onClick={ () => onClick(action, rowId, j, timeText) } multiFlag={ multiFlag } key={ j }/>; 
	})
	// name cell
	timeRowNodes.unshift(<NameCell name={ userDat.name } key="user"/>);
	return (<tr className="time-row" datarow={ datarow }>
		{ timeRowNodes }
	</tr>);
}

function FullDataRow(userDat, verOffset, rowId, onClick) {
	// get total rows needed
	var dispTotal = 1;
	userDat.timeRow.map((multiDat) => {
		if (multiDat !== null && multiDat.length > 1) {
			if (multiDat.length > dispTotal) dispTotal = multiDat.length;
		}
	});
	var rowNodeList = [];
	// print out each row one by one
	for (let i = 0; i < dispTotal; i++) {
		var timeRowNodes = userDat.timeRow.map((multiDat, j) => {
			var timeDat = null;
			if (multiDat !== null && i < multiDat.length) {
				timeDat = multiDat[i];
			}
			if (timeDat === null) {
				return <td className="dark-cell" key={ j }></td>; 
			}
			return <TimeCell timeDat={ timeDat } verOffset={ verOffset } active="true"
				onClick={ () => onClick("view-toggle", rowId, j, [""]) } multiFlag={ false } key={ j }/>;
		})
		if (i === 0) timeRowNodes.unshift(<NameCell name={ userDat.name } key="user"/>);
		else timeRowNodes.unshift(<td className="dark-cell" key="empty"></td>);
		/*rowNodeList.push(<tr className="time-row" key={ rowId + "#" + i }>
			<td onClick={ () => onClick("view-toggle", rowId, 0, [""]) }>Test</td></tr>);
*/
		rowNodeList.push(<tr className="time-row" key={ rowId + "#" + i} datarow="yes">{ timeRowNodes }</tr>);
	}
	// draw separators
	var sepList1 = [];
	var sepList2 = [];
	for (let i = 0; i < userDat.timeRow.length + 1; i++) {
		sepList1.push(<td className="sep-cell" key={ i }></td>);
		sepList2.push(<td className="sep-cell" key={ i }></td>);
	};
	rowNodeList.unshift(<tr className="sep-row" key={ rowId + "#A" }>{ sepList1 }</tr>);
	rowNodeList.push(<tr className="sep-row" key={ rowId + "#B" }>{ sepList2 }</tr>);
	return rowNodeList;
}

function nullViewState() {
	return {
		openRow: null
	};
}

function EditCell(props) {
	var innerNode = props.text;
	var isValid = props.text === "" || props.valid;
	// -- input box case
	if (props.isInput) {
		innerNode = (<input value={ props.text } valid={ isValid.toString() } dirty={ props.dirty.toString() }
			onChange={ (e) => props.editText(e.target.value) }></input>);
	}
	return (<td className="edit-cell" onClick={ props.onClick }>
		<div className="cell-wrap" valid={ isValid.toString() } dirty={ props.dirty.toString() }>{ innerNode }</div></td>);
}

function EditRow(props) {
	var stratTotal = props.stratTotal;
	var rowId = props.rowId;
	var eState = props.eState;

	// edit state

	// main cells
	var editNodes = [];
	for (let i = 0; i < stratTotal; i++) {
		editNodes.push(<EditCell text={ eState.eData[i + 1] } valid={ validTime(eState.eData[i + 1]) }
			dirty={ eState.eData[i + 1] !== eState.oldText[i + 1] }
			editText={ (v) => eState.write(eState.colId + 1, v) } isInput={ eState.colId === i }
			onClick={ () => eState.click(rowId, i, eState.eData) } key={ i }></EditCell>);
	}
	// player name cell
	// -- name editing disabled after initial submission
	if (rowId === null) {
		editNodes.unshift(<EditCell text={ eState.eData[0] } valid={ validName(eState.eData[0]) }
			dirty={ eState.eData[0] !== eState.oldText[0] }
			editText={ (v) => eState.write(0, v) } isInput={ eState.colId === -1 }
			onClick={ () => eState.click(rowId, -1, eState.eData) } key="name"></EditCell>);
	} else {
		editNodes.unshift(<td key="name">{ eState.eData[0] }</td>);
	}
	// submit button
	var isValid = validEdit(eState.eData);
	if (isValid) {
		editNodes.push(<td className="edit-cell" key="act">
			<div className="inner-button" onClick={ eState.submit }>Add</div>
		</td>);
	}
	return <tr className="time-row" key="init-submit">{ editNodes }</tr>;
}

function nullEditState() {
	return {
		active: false,
		rowId: null,
		colId: -1,
		oldText: []
	};
}

function diffText(oldText, editText) {
	var dText = [];
	for (let i = 1; i < editText.length; i++) {
		if (editText[i] !== "" && oldText[i] !== editText[i]) {
			dText.push(editText[i]);
		} else {
			dText.push(null);
		}
	}
	return dText;
}

function verAdjustTime(ver, rawTime, time) {
	var verName = "JP";
	if (ver === "us") verName = "US";
	if (rawTime === time) return "(" + verName + ")";
	return "(" + formatTime(rawTime) + " " + verName + ")";
}

export function StarTable(props) {
	var colList = props.colList;
	var recordMap = props.recordMap;
	var mv = props.mv;
	var timeTable = props.timeTable;
	var canWrite = props.canWrite === "true";
	var editTT = props.editTT;

	var stratTotal = colList.length;
	if (mv !== null) stratTotal = mv.list.length;

	var verOffset = newVerOffset("jp", false, 0);
	if (props.verOffset !== undefined) {
		verOffset = props.verOffset;
	}

	// sort state
	const [sortId, setSortId] = useState(0);

	// view state
	const [vState, setVState] = useState(nullViewState());

	// view functions
	const viewClick = (row) => {
		if (vState.rowId !== row) {
			setVState({ rowId: row });
		} else {
			setVState({ rowId: null });
		}
	};

	// edit state
	const [eState, setEditState] = useState(nullEditState());
	const [editText, setEditText] = useState([]);

	// edit functions
	const editClick = (row, col, eData) => {
		var oldText = eState.oldText;
		if (row !== eState.rowId) oldText = eData;
		setEditState({
			active: true,
			rowId: row,
			colId: col,
			oldText: oldText
		});
		setEditText(eData);
	};

	const cellClick = (action, row, col, eData) => {
		if (action === "edit") editClick(row, col, eData);
		else if (action === "view-toggle") viewClick(row);
	}

	const editWrite = (col, v) => {
		setEditText(updateArray(editText, col, v));
	};

	const editSubmit = () => {
		setEditState(nullEditState());
		editTT(editText[0], diffText(eState.oldText, editText), colList);
	};

	eState.eData = editText;
	eState.click = cellClick;
	eState.write = editWrite;
	eState.submit = editSubmit;

	// build table header
	var eActive = (!eState.active).toString();
	var imgNode = (active) => (<div className="float-frame">
		<img src="/icons/sort-icon.png" active={ active.toString() } className="float-icon" alt=""></img></div>);
	// -- was 77% with "extra"
	var tdWidth = "" + Math.floor(85 / stratTotal) + "%";
	var nameList = nameListMergeView(mv, colList);
	var headerNodes = nameList.map((name, i) => {
		return (<td className="time-cell" key={ name } active={ eActive } width={ tdWidth }
			onClick={ () => { if (!eState.active) setSortId(i + 1) } }>{ name } { imgNode(sortId === i + 1) }</td>);
	});
	{
		headerNodes.unshift(<td className="time-cell" key="strat" active={ eActive } width="15%"
			onClick={ () => setSortId(0) }>Strat { imgNode(sortId === 0) }</td>);
	}
	//headerNodes.push(<td key="act">*</td>);

	// wr header
	var recordList = recordListMergeView(mv, colList, recordMap);
	var recordNodes = recordList.map((record) => {
		var timeNode = formatTime(record.time);
		if ((verOffset.focusVer === "jp" && record.rowDef.ver === "us") ||
			(verOffset.focusVer === "us" && record.rowDef.ver === "jp")) {
			timeNode = (<span>{ formatTime(record.time) } {
				verAdjustTime(record.rowDef.ver, record.rawTime, record.time) }</span>);
		}
		return (<td className="record-cell" key={ record.rowDef.name }>{ timeNode }</td>);
	});
	recordNodes.unshift(<td className="record-cell" key="wr">WR</td>);
	//recordNodes.push(<td key="act"></td>);

	// filter table by colums + sort table data
	//var filterTable = filterTimeTable(timeTable, colList);
	var filterTable = filterTableMergeView(timeTable, mv, colList);
	if (sortId > stratTotal) setSortId(0);
	filterTable = sortTimeTable(filterTable, sortId);

	// build time table
	var timeTableNodes = [];
	filterTable.map((userDat, i) => {
		// -- edit case
		if (eState.active && eState.rowId === i) {
			timeTableNodes.push(<EditRow stratTotal={ stratTotal } key={ i } rowId={ i } eState={ eState }></EditRow>);
			return;
		}
		// can expand row
		var canExpandRow = false;
		userDat.timeRow.map((multiDat) => {
			if (multiDat !== null && multiDat.length > 1) canExpandRow = true;
		});
		// edit action
		var action = "none"
		if (canWrite) action = "edit";
		else if (canExpandRow) action = "view-toggle";
		// special CSS for last row 
		var datarow = "yes";
		if (i === timeTable.length - 1) datarow = "no";
		// -- expanded view case
		if (vState.rowId === i) {
			timeTableNodes = timeTableNodes.concat(FullDataRow(userDat, verOffset, i, cellClick));
		// -- normal case
		} else {
			timeTableNodes.push(<DataRow userDat={ userDat } verOffset={ verOffset } action={ action }
				rowId={ i } onClick={ cellClick } datarow={ datarow } key={ userDat.name }/>);
		}
	});

	var infoRowNode = null;

	// build initial submit row
	// -- normal case
	if (canWrite && (!eState.active || eState.rowId !== null)) {
		var exRowNodes = [];
		for (let i = 0; i < stratTotal; i++) {
			exRowNodes.push(<td className="init-cell" key={ i }
				onClick={ () => editClick(null, i, Array(stratTotal + 1).fill("")) }></td>);
		}
		exRowNodes.unshift(<td className="init-cell" key="name"
			onClick={ () => editClick(null, -1, Array(stratTotal + 1).fill("")) }><i>New</i></td>);
		exRowNodes.push(<td className="misc-cell" key="act"></td>);
		timeTableNodes.push(<tr className="time-row" key="init-submit">{ exRowNodes }</tr>);
	// -- edit case
	} else if (canWrite) {
		//infoRowNode = (<td colspan={ stratTotal + 1 }></td>);
		timeTableNodes.push(<EditRow stratTotal={ stratTotal } key="edit" rowId={ null } eState={ eState }></EditRow>)
	}
	//if (infoRowNode !== null) timeTableNodes.push(<tr key="info-submit">{ infoRowNode }</tr>);

	return (
		<div>
		<div className="table-cont">
			<table className="time-table"><tbody>
				<tr className="time-row" key="header">{ headerNodes }</tr>
				<tr className="time-row" key="record">{ recordNodes }</tr>
				{ timeTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}