import React, { useState } from 'react'

import rowData from './json/row_data.json'
import { filterTimeTable } from "./timetable"
import { rawMS, stratRowVer } from './vercalc'

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

export function formatFrames(frames) {
	// absolute value frames
	var neg = frames < 0;
	frames = Math.abs(frames);
	// calc each section
	var triFrames = Math.floor(frames / 3);
	var triMS = frames % 3;
	var sec = Math.floor(triFrames / 10);
	var tSec = Math.floor(triFrames % 10);
	var hSec = 0;
	if (triMS === 1) hSec = 3;
	else if (triMS === 2) hSec = 6;
	// final string
	var fs = "" + sec + "." + tSec + hSec;
	if (neg) fs = "-" + fs;
	return fs;
}

function formatTime(time) {
	var ms = time % 100;
	var sec = Math.floor(time / 100) % 60;
	var min = Math.floor(time / 6000);
	if (sec === 0 && min === 0) return "0." + ms;
	else if (min === 0) return sec + "." + ms.toString().padStart(2, '0');
	return min + ":" + sec.toString().padStart(2, '0') + "." + ms.toString().padStart(2, '0');
}

function formatTimeDat(timeDat) {
	if (timeDat === null) return "";
	return formatTime(timeDat.time);
}

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
	var focusVer = null;
	var offset = 0;
	var stratTotal = colList.length;
	var timeTable = props.timeTable;
	var canWrite = props.canWrite === "true";
	var editTT = props.editTT;

	var verData = props.verData;
	if (verData !== undefined) {
		focusVer = verData.focusVer;
		offset = verData.offset;
	}

	// sort state
	const [sortId, setSortId] = useState(0);

	// edit state
	const [eState, setEditState] = useState(nullEditState());
	const [editText, setEditText] = useState([]);

	// sort columns
	colList = colList.sort(function (a, b) {
		if (a[1].name === "Open") return -1;
		else if (b[1].name === "Open") return 1;
		return a[1].sortRecord.time - b[1].sortRecord.time;
	});

	// edit functions
	var editClick = () => {};
	if (canWrite) {
		editClick = (row, col, eData) => {
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
	}
	const editWrite = (col, v) => {
		setEditText(updateArray(editText, col, v));
	};

	const editSubmit = () => {
		setEditState(nullEditState());
		editTT(editText[0], diffText(eState.oldText, editText), colList);
	};

	eState.eData = editText;
	eState.click = editClick;
	eState.write = editWrite;
	eState.submit = editSubmit;

	// build table header
	var eActive = (!eState.active).toString();
	var imgNode = (active) => (<div className="float-frame">
		<img src="/icons/sort-icon.png" active={ active.toString() } className="float-icon" alt=""></img></div>);
	var tdWidth = "" + Math.floor(77 / stratTotal) + "%";
	var headerNodes = colList.map((_strat, i) => {
		var [colId, strat] = _strat;
		return (<td className="time-cell" key={ strat.name } active={ eActive } width={ tdWidth }
			onClick={ () => { if (!eState.active) setSortId(i + 1) } }>{ strat.name } { imgNode(sortId === i + 1) }</td>);
	});
	{
		headerNodes.unshift(<td className="time-cell" key="strat" active={ eActive } width="15%"
			onClick={ () => setSortId(0) }>Strat { imgNode(sortId === 0) }</td>);
	}
	headerNodes.push(<td key="act">*</td>);

	// wr header
	var recordNodes = colList.map((_strat, i) => {
		var [colId, strat] = _strat;
		var timeNode = formatTime(strat.record.time);
		if ((focusVer === "jp" && strat.record.ver === "us") ||
			(focusVer === "us" && strat.record.ver === "jp")) {
			timeNode = (<span>{ formatTime(strat.record.time) } {
				verAdjustTime(strat.record.ver, strat.record.rawTime, strat.record.time) }</span>);
		}
		return (<td className="record-cell" key={ strat.name }>{ timeNode }</td>);
	});
	recordNodes.unshift(<td className="record-cell" key="wr">WR</td>);
	recordNodes.push(<td key="act"></td>);

	// filter table by colums + sort table data
	var filterTable = filterTimeTable(timeTable, colList);
	if (sortId > colList.length) setSortId(0);
	if (sortId === 0 || sortId > colList.length) {
		filterTable.sort(function(a, b) { return a.bestTime - b.bestTime });
	} else {
		filterTable.sort(function(a, b) {
			var si = sortId - 1;
			if (a.tmList[si] === null) {
				if (b.tmList[si] === null) return a.bestTime - b.bestTime;
				else return 1;
			} else if (b.tmList[si] === null) return -1;
			var diff = a.tmList[si].time - b.tmList[si].time;
			if (diff === 0) return a.bestTime - b.bestTime;
			return diff;
		});
	}

	// build time table
	var timeTableNodes = filterTable.map((userDat, i) => {
		// -- edit case
		if (eState.active && eState.rowId === i) {
			return (<EditRow stratTotal={ stratTotal } key={ i } rowId={ i } eState={ eState }></EditRow>);
		}
		// -- normal case
		var timeText = userDat.tmList.map(formatTimeDat);
		timeText.unshift(userDat.name);
		// build time cells
		var timeRowNodes = userDat.tmList.map((timeDat, j) => {
			var active = "true";
			if (!canWrite) active = "false";
			var cellText = formatTimeDat(timeDat);
			// variant text
			if (timeDat !== null && timeDat.variant_list.length > 0) {
				cellText = cellText + " [";
				timeDat.variant_list.map((v, i) => {
					if (i !== 0) cellText = cellText + ",";
					var vpp = parseInt(v) + 1;
					cellText = cellText + vpp;
				})
				cellText = cellText + "]";
			}
			// if the version matters
			if (timeDat !== null && focusVer !== null) {
				if ((focusVer === "jp" && timeDat.ver === "us") ||
					(focusVer === "us" && timeDat.ver === "jp")) {
					cellText = (<span>{ cellText } <em>
						{ verAdjustTime(timeDat.ver, timeDat.rawTime, timeDat.time) }</em></span>);
				}
			}
			return (<td className="time-cell" key={ j } active={ active }
				onClick={ () => editClick(i, j, timeText) }>{ cellText }</td>);
		})
		// name + ending cell
		timeRowNodes.unshift(<td key="user" ps={ userDat.playStd }>{ userDat.name }</td>);
		timeRowNodes.push(<td key="empty"></td>)
		var dataRow = "yes";
		if (i === timeTable.length - 1) dataRow="no";
		return (<tr className="time-row" datarow={ dataRow } key={ userDat.name }>
			{ timeRowNodes }
		</tr>);
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