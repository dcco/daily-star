
import React, { useState, useEffect } from 'react'

import { VarSpace } from './variant_def'
import { TimeDat, VerOffset, rawMS, formatTime } from './time_dat'
import { SGrid, lookupGrid, setGrid } from './sparse_grid'
import { TimeRow, UserDat } from './time_table'
import { strIdNick } from './play_wrap'
import { ColConfig, firstStratColConfig } from './col_config'
import { StarDef, varSpaceStarDef } from './org_star_def'
import { DraftDat, staticDraftDat, emptyDraftDat, changeStratDraftDat, stratNameDraftDat } from './draft_dat'
import { EditObj } from './edit_perm' 
import { CellAct } from './rx_star_row'
import { EditCell, InputCell, validTime } from './rx_edit_cell'
import { ValidStyle, EditSubmitArea } from './rx_edit_submit_area'

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
	*/

type DraftState = {
	"grid": SGrid<DraftDat>
};

function newDraftState(): DraftState
{
	return { "grid": {} };
}

function isEmptyDS(ds: DraftState): boolean
{
	return Object.entries(ds.grid).length === 0;
}

function cleanupDS(ds: DraftState): DraftState
{
	var newDS = newDraftState();
	for (const [k, dat] of Object.entries(ds.grid)) {
		if (dat.text !== "") newDS.grid[k] = dat;
	}
	return newDS;
}

function updateDS(ds: DraftState, colId: number, subRowId: number, v: DraftDat): DraftState
{
	setGrid(ds.grid, colId, subRowId, v);
	return { "grid": ds.grid };
}

function updateLocDS(ds: DraftState, colId: number, subRowId: number, f: (a: DraftDat) => DraftDat): DraftState
{
	var draftDat = lookupGrid(ds.grid, colId, subRowId);
	if (draftDat !== null) {
		var newDat = f(draftDat);
		setGrid(ds.grid, colId, subRowId, newDat);
	}
	return { "grid": ds.grid };
}

function heightColDS(timeRow: TimeRow, ds: DraftState, colId: number): number
{
	var multiDat = timeRow[colId];
	var height = 0;
	if (multiDat !== null) height = multiDat.length;
	var draftHeight = height;
	while (true) {
		var curDat = lookupGrid(ds.grid, colId, draftHeight);
		if (curDat === null || curDat.text === "") return draftHeight;
		draftHeight = draftHeight + 1;
	}
	throw("rx_edit_row - Unreachable.");
}

function heightDS(timeRow: TimeRow, ds: DraftState): [number, number[]]
{
	var height = 0;
	var heightList: number[] = [];
	for (let i = 0; i < timeRow.length; i++) {
		var h = heightColDS(timeRow, ds, i);
		height = Math.max(height, h);
		heightList.push(h);
	}
	return [height, heightList];
}

/*
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
*/

function lookupTimeDat(timeRow: TimeRow, colId: number, subRowId: number): TimeDat | null
{
	var multiDat = timeRow[colId];
	if (multiDat !== null && subRowId < multiDat.length) {
		return multiDat[subRowId];
	}
	return null;
}

function lookupViewDraftDS(cfg: ColConfig, timeRow: TimeRow,
	ds: DraftState, colId: number, subRowId: number): DraftDat | null
{
	// check if draft already exists
	var draftDat = lookupGrid(ds.grid, colId, subRowId);
	if (draftDat !== null) return draftDat;
	// otherwise, see if a time has been stored
	var timeDat = lookupTimeDat(timeRow, colId, subRowId);
	if (timeDat !== null) return staticDraftDat(timeDat);
	// otherwise return null
	return null;
}

function lookupEditDraftDS(cfg: ColConfig, starDef: StarDef, timeRow: TimeRow,
	ds: DraftState, colId: number, subRowId: number): [DraftDat, DraftState | null]
{
	// check if draft already exists
	var draftDat = lookupGrid(ds.grid, colId, subRowId);
	if (draftDat !== null) return [draftDat, null];
	// otherwise, see if a time has been stored
	var timeDat = lookupTimeDat(timeRow, colId, subRowId);
	if (timeDat !== null) {
		// if it has, create a static var space based on the time dat			
		var newDat = staticDraftDat(timeDat);
		return [newDat, updateDS(ds, colId, subRowId, newDat)];
	}
	// otherwise, initialize row definition from [default strat + variant space]
	var stratDef = firstStratColConfig(cfg, colId);
	var newDat = emptyDraftDat(stratDef.vs);
	return [newDat, updateDS(ds, colId, subRowId, newDat)];
}

	/*
		validation
	*/

export function validateDS(ds: DraftState): [ValidStyle, string | null] {
	// empty check
	var ds = cleanupDS(ds);
	if (isEmptyDS(ds)) return ["init", "No modifications."];
	// valid time check
	for (const [k, draftDat] of Object.entries(ds.grid)) {
		if (!validTime(draftDat.text)) {
			return ["error", "Must fix invalid times."];
		} 
	}
	return ["valid", "Ready to submit."];
}
/*
export function convertDS(ds: DraftState): TimeDat[] {
	var ds = cleanupDS(ds);
	var timeList: TimeDat[] = [];
	for (const [k, draftDat] of Object.entries(ds.grid)) {
		timeList.push();
	}

}*/

	/* edit row: displays
		- all submitted times w/ version + variant information
		- slots for un-submitted times
		- "edit toolbar" w/ submission button, warning msgs, version / variant options
		- auto-creates new boxes when necessary
	*/

type EditRowProps = {
	"cfg": ColConfig,
	"userDat": UserDat,
	"verOffset": VerOffset,
	"rowId": number | null,
	"editObj": EditObj,
	"editPos": EditPos,
	"cellClick": (a: CellAct, i: number | null, j: number, k: number) => void,
	"submit": (timeList: TimeDat[]) => void
}

export function EditRow(props: EditRowProps): React.ReactNode {
	const cfg = props.cfg;
	const userDat = props.userDat;
	const verOffset = props.verOffset;
	const timeRow = userDat.timeRow;
	const rowId = props.rowId;
	const editObj = props.editObj;
	const starDef = editObj.starDef;
	const editPos = props.editPos;
	const cellClick = props.cellClick;

	const [ds, setDS] = useState(newDraftState());

	// edit functions
	const editLoc = (colId: number, subRowId: number, f: (a: DraftDat) => DraftDat) => {
		setDS(updateLocDS(ds, colId, subRowId, f));
	};

	const changeStrat = (stratName: string) => {
		editLoc(editPos.colId, editPos.subRowId, (curDat) => {
			var vs = varSpaceStarDef(starDef, stratName);
			if (vs === null) throw('Attempted to switch to non-existent strat ' + stratName + '.');
			return changeStratDraftDat(vs, curDat);
		});
	}

	// cleanup on cell change
	useEffect(() => { setDS(cleanupDS(ds)); }, [editPos]);

	// get the current draft cell being edited
	var [draftDat, newDS] = lookupEditDraftDS(cfg, starDef, timeRow, ds, editPos.colId, editPos.subRowId);
	if (newDS !== null) setDS(newDS);

	// get current variant space
	var vs = varSpaceStarDef(starDef, stratNameDraftDat(draftDat));
	if (vs === null) throw('Attempting to work on non-existent strat ' + stratNameDraftDat(draftDat) + '.');
	
	// generate edit cells
	var editNodes: React.ReactNode[] = [];
	var [height, hList] = heightDS(timeRow, ds);
	var dispHeight = height + 1;
	for (let j = 0; j < height + 1; j++) {
		var rowNodes: React.ReactNode[] = [];
		for (let i = 0; i < timeRow.length; i++) {
			// input cell case
			if (editPos.colId === i && editPos.subRowId === j) {
				rowNodes.push(<InputCell draftDat={ draftDat }
					onWrite={ (v) => editLoc(editPos.colId, j, (dat) => { dat.text = v; return dat; }) } key={ i }/>);
				continue;
			}
			// display case
			var draftDatN = lookupViewDraftDS(cfg, timeRow, ds, i, j);
			if (draftDatN !== null || j === hList[i]) {
				rowNodes.push(<EditCell draftDat={ draftDatN } verOffset={ verOffset } dirty={ false }
					onClick={ () => cellClick("edit", rowId, i, j) } key={ i }/>);
			} else {
				rowNodes.push(<td className="dark-cell" key={ i }></td>);
			}
		}
		// player name cell
		if (j === 0) rowNodes.unshift(<td key="name">{ strIdNick(userDat.id) }</td>);
		else rowNodes.unshift(<td className="dark-cell" key="name"></td>);
		editNodes.push(<tr className="time-row" key={ j }>{ rowNodes }</tr>);
	}
	
	// validation
	var [style, infoText] = validateDS(ds);

	// return final row
	return <React.Fragment>
		{ editNodes }
		<tr className="time-row" key="edit-info-row">
			<td></td>
			<td className="submit-area" colSpan={ timeRow.length }>
				<EditSubmitArea cfg={ cfg } colId={ editPos.colId } vs={ vs }
					curDat={ draftDat } editDat={ (f) => editLoc(editPos.colId, editPos.subRowId, f) }
					changeStrat={ changeStrat } submit={ props.submit }
					cancel={ () => cellClick("stop-edit", null, 0, 0) }
					style={ style } infoText={ infoText }/>
			</td>
		</tr>
	</React.Fragment>;
}

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
