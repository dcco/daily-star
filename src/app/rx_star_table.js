import React, { useState } from 'react'

import { formatTime, newVerOffset } from "./time_dat"
import { keyIdent, freshTimeRow, hasSubRows, sortTimeTable } from "./time_table"
import { strIdNick } from "./play_wrap"
import { nameListMergeView, recordListMergeView, filterTableMergeView } from "./merge_view"
import { noEditPerm, hasWritePerm, hasNewPerm } from "./edit_perm"
import { verAdjustTime, TimeCell, RecordCell, EditCell, NameCell } from "./rx_star_cell"
import { DataRow } from "./rx_star_row"
import { nullEditPos, EditRow } from "./rx_edit_row"

	/*
		##########
		STAR TABLE
		##########
		react element designed to display timetable information
		+ optionally provides hooks to modify timetable info
	*/

	// time manipulation

function validName(s) {
	return s.match(/^[a-zA-Z0-9 _]+$/) !== null;
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
		if (i === 0) timeRowNodes.unshift(<NameCell id={ userDat.id } key="user"/>);
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

	/*
		star table: displays times from a time table
		* colList/mv - column display configuration
		* recordMap - record data for the time table
		* timeTable - time table
		* verOffset - version offset for time display
		* editPerm / editTT - params for editable tables
	*/

export function StarTable(props) {
	var colList = props.colList;
	var mv = props.mv;
	var recordMap = props.recordMap;
	var timeTable = props.timeTable;
	var editTT = props.editTT;

	var editPerm = props.editPerm;
	if (editPerm === undefined) editPerm = noEditPerm();

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
	const [editPos, setEditPos] = useState(nullEditPos());

	// edit functions
	const editClick = (row, col, subRow) => {
		setEditPos({
			active: true,
			rowId: row,
			colId: col,
			subRowId: subRow
		});
	};

	const cellClick = (action, row, col, subRow) => {
		if (action === "edit") editClick(row, col, subRow);
		else if (action === "view-toggle") viewClick(row);
	}

	/*const editWrite = (col, v) => {
		setEditText(updateArray(editText, col, v));
	};*/

	const editSubmit = () => {
		setEditPos(nullEditState());
		editTT(editText[0], diffText(eState.oldText, editText), colList);
	};
/*
	eState.eData = editText;
	eState.click = cellClick;
	eState.write = editWrite;
	eState.submit = editSubmit;*/

	/* ----- TABLE HEADER ----- */

	var sortActive = !editPos.active;
	// -- was 77% with "extra"
	var tdWidth = "" + Math.floor(85 / stratTotal) + "%";
	var nameList = nameListMergeView(mv, colList);

	var imgNodeFun = (active) => (<div className="float-frame">
		<img src="/icons/sort-icon.png" active={ active.toString() } className="float-icon" alt=""></img></div>);
	var headerNodes = nameList.map((name, i) => {
		return (<td className="time-cell" key={ name } active={ sortActive.toString() } width={ tdWidth }
			onClick={ () => { if (sortActive) setSortId(i + 1) } }>{ name } { imgNodeFun(sortId === i + 1) }</td>);
	});
	headerNodes.unshift(<td className="time-cell" key="strat" active={ sortActive.toString() } width="15%"
		onClick={ () => setSortId(0) }>Strat { imgNodeFun(sortId === 0) }</td>);

	/* ----- RECORD ROW ----- */

	var recordList = recordListMergeView(mv, colList, recordMap);
	var recordNodes = recordList.map((record) => {
		return <RecordCell timeDat={ record } verOffset={ verOffset } key={ record.rowDef.name }/>;
	});
	recordNodes.unshift(<td className="record-cell" key="wr">WR</td>);

	/* ----- TIME TABLE ROWS ----- */

	// filter table by colums + sort table data
	var filterTable = filterTableMergeView(timeTable, mv, colList);
	if (sortId > stratTotal) setSortId(0);
	filterTable = sortTimeTable(filterTable, sortId);

	// build time table
	var timeTableNodes = [];
	filterTable.map((userDat, i) => {
		// -- edit row case
		if (editPos.active && editPos.rowId === i) {
			//addEditRows(userDat, i, editPos, editClick);
			return;
		}
		// -- normal row case
		// click action
		var action = "none"
		if (editPerm.canEdit && hasWritePerm(editPerm, userDat.id)) action = "edit";
		else if (hasSubRows(userDat.timeRow)) action = "view-toggle";
		// special CSS for last row [TODO: refactor] 
		var datarow = "yes";
		if (i === timeTable.length - 1) datarow = "no";
		// add row
		timeTableNodes.push(<DataRow userDat={ userDat } verOffset={ verOffset } rowId={ i }
			action={ action } onClick={ viewClick } datarow={ datarow } key={ keyIdent(userDat.id) }/>);
	});
	/*filterTable.map((userDat, i) => {
		// -- edit case
		if (editPos.active && editPos.rowId === i) {
			timeTableNodes.push(<EditRow userDat={ userDat } rowId={ i } editPos={ editPos }
				cellClick={ cellClick } key={ i }></EditRow>);
			return;
		}
		// checks if ROW has data to expand
		var canExpandRow = false;
		userDat.timeRow.map((multiDat) => {
			if (multiDat !== null && multiDat.length > 1) canExpandRow = true;
		});
		// determine click action
		var action = "none"
		if (editPerm.canEdit && hasWritePerm(editPerm, userDat.id)) action = "edit";
		else if (canExpandRow) action = "view-toggle";
		// special CSS for last row [TODO: refactor] 
		var datarow = "yes";
		if (i === timeTable.length - 1) datarow = "no";
		// -- expanded view case
		if (vState.rowId === i) {
			timeTableNodes = timeTableNodes.concat(FullDataRow(userDat, verOffset, i, cellClick));
		// -- normal case
		} else {
			timeTableNodes.push(<DataRow userDat={ userDat } verOffset={ verOffset } rowId={ i }
				action={ action } onClick={ cellClick } datarow={ datarow } key={ keyIdent(userDat.id) }/>);
		}
	});*/

	/* ----- INITIAL SUBMIT ROW ----- */
	
	// build initial submit row
	// -- normal case (must not have any editable rows)
	if (hasNewPerm(editPerm) && (!editPos.active || editPos.rowId !== null)) {
		var exRowNodes = [];
		for (let i = 0; i < stratTotal; i++) {
			exRowNodes.push(<td className="init-cell" key={ i }
				onClick={ () => editClick(null, i, Array(stratTotal + 1).fill("")) }></td>);
		}
		var nText = strIdNick(editPerm.newId);
		if (nText === "@me") nText = "New";
		exRowNodes.unshift(<td className="init-cell" key="name"
			onClick={ () => editClick(null, -1, Array(stratTotal + 1).fill("")) }><i>{ nText }</i></td>);
		//exRowNodes.push(<td className="misc-cell" key="act"></td>);
		timeTableNodes.push(<tr className="time-row" key="init-submit">{ exRowNodes }</tr>);
	// -- edit case
	} else if (editPerm.canEdit) {
		var newDat = freshTimeRow(stratTotal, editPerm.newId);
		timeTableNodes.push(<EditRow userDat={ newDat } rowId={ null } editPos={ editPos }
			cellClick={ cellClick } key="edit"></EditRow>)
	}

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