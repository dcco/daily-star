
import React, { useState } from 'react'

import { TimeDat, rawMS, formatTime } from './time_dat'
import { lookupGrid, setGrid } from './sparse_grid'
import { strIdNick } from './play_wrap'
import { EditCell } from './rx_edit_cell'

	/* auxiliary functions for front-end time submission validity */
/*
function validTimeDat(timeDat: TimeDat | null) {
	if (timeDat === null) return true;
	return validTime(s);
}
*/
	/* 
		edit pos: tracks which cell is being edited, if any
			(this state is passed in as a prop because edit mode is triggered externally)
	 */

export type EditPos = {
	"active": boolean,
	"rowId": number | null,
	"colId": number,
	"subRowId": number
}

export function nullEditPos(): EditPos {
	return {
		"active": false,
		"rowId": null,
		"colId": 0,
		"subRowId": 0
	};
}

export function indexEditPos(rowId: number | null, colId: number): EditPos {
	return {
		"active": true,
		"rowId": rowId,
		"colId": colId,
		"subRowId": 0
	};
}

	/*
		draft_state: tracks new times that have been written + variant information
			(when variant information cannot be drawn from the original time row)
		* text grid - tracks the text in the cell being edited
		* dat grid - tracks the row_def + metadata stored in the given cell
			(tracked separately from the text grid since time_dats cannot contain raw text)
	*/
/*
function newDraftState()
{
	return {
		"textGrid": {},
		"datGrid": {}
	};
}

function getTextDS(timeRow, ds, colId, subRowId) {
	// attempt to find text from the draft
	var timeText = lookupGrid(ds.timeGrid, colId, subRowId);
	if (timeText !== null) return timeText;
	// otherwise, see if there's a time already stored
	var multiDat = timeRow[colId];
	if (multiDat !== null && subRowId < multiDat.length) {
		var timeDat = multiDat[subRowId];
		if (timeDat !== null) return formatTime(timeDat.rawTime);
	}
	return "";
}

function getTimeDatDS(timeRow, ds, colId, subRowId) {
	// attempt to find time from the draft
	var timeText = lookupGrid(timeRow, colId, subRowId);
	if (timeText !== null) {
		var time = rawMS(timeText);
		var rowDef = lookupGrid(rowDefGrid, colId, subRowId);
		return newTimeDat();
	}
	// otherwise, see if there's a time already stored
	var multiDat = timeRow[colId];
	if (multiDat !== null && subRowId < multiDat.length) {
		var timeDat = multiDat[subRowId];
		if (timeDat !== null) return formatTime(timeDat.rawTime);
	}
	return "";
}

function updateDS(ds, colId, subRowId, v) {
	setGrid(ds.textGrid, colId, subRowId, v);
	return {
		"textGrid": ds.textGrid,
		"rowDefGrid": ds.rowDefGrid
	};
}
*/
	/* edit row: displays
		- all submitted times w/ version + variant information
		- slots for un-submitted times
		- "edit toolbar" w/ submission button, warning msgs, version / variant options
		- auto-creates new boxes when necessary
	*/
/*
export function EditRow(props) {
	const userDat = props.userDat;
	const timeRow = userDat.timeRow;
	const rowId = props.rowId;
	const editPos = props.editPos;
	const cellClick = props.cellClick;

	const [ds, setDS] = useState({});

	// edit functions
	const editWrite = (colId, subRowId, v) => {
		setDS(updateDS(ds, colId, subRowId, v));
	};

	// generate edit cells
	var editNodes = [];
	for (let i = 0; i < timeRow.length; i++) {*/
		/*var multiDat = timeRow[i];
		var timeDat = null;
		if (multiDat !== null && multiDat.length > 0) timeDat = multiDat[0];*/
		// input cell case
/*		if (editPos.colId === i) {
			var timeText = getTextDS(timeRow, ds, i, 0);
			editNodes.push(<InputCell text={ timeText } valid={ validTime(timeText) }/>);
		// other cell
		} else {
			var timeDat = getTimeDatDS(timeRow, ds, i, 0);
			editNodes.push(<EditCell timeDat={ timeDat } valid={ validTimeDat(timeDat) } dirty={ false }
				onWrite={ (v) => editWrite(editPos.colId, 0, v) }
				onClick={ () => cellClick("edit", rowId, i) } key={ i }/>);
		}
	}
	// player name cell
	editNodes.unshift(<td key="name">{ strIdNick(userDat.id) }</td>);

	// return final row
	return <tr className="time-row" key="edit-row">{ editNodes }</tr>;
}*/

/*
function EditRow(props) {
	var stratTotal = props.stratTotal;
	var rowId = props.rowId;
	var eState = props.eState;

	// main cells
	var editNodes = [];
	for (let i = 0; i < stratTotal; i++) {
		editNodes.push(<EditCell text={ eState.eData[i + 1] } valid={ validTime(eState.eData[i + 1]) }
			dirty={ eState.eData[i + 1] !== eState.oldText[i + 1] }
			editText={ (v) => eState.write(eState.colId + 1, v) } isInput={ eState.colId === i }
			onClick={ () => eState.click("edit", rowId, i, eState.eData) } key={ i }></EditCell>);
	}
	// player name cell
	// -- name editing disabled after initial submission
	if (rowId === null) {
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
}*/


	/*	
		-- OLD CODE FOR NAME w/ VALIDITY CHECKING
	editNodes.unshift(<EditCell text={ eState.eData[0] } valid={ validName(eState.eData[0]) }
			dirty={ eState.eData[0] !== eState.oldText[0] }
			editText={ (v) => eState.write(0, v) } isInput={ eState.colId === -1 }
			onClick={ () => eState.click("edit", rowId, -1, eState.eData) } key="name"></EditCell>); */
