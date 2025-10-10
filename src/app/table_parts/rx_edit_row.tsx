
import React, { useState, useEffect } from 'react'

import { VarSpace } from '../variant_def'
import { TimeDat, VerOffset, rawMS, formatTime } from '../time_dat'
import { SGrid, lookupGrid, setGrid } from '../sparse_grid'
import { TimeRow, UserDat, hasSubRows, lookupTimeRow } from '../time_table'
import { PlayData, strIdNickPD } from '../play_data'
import { ColConfig, defStratColConfig } from '../col_config'
import { StarDef, varSpaceStarDef } from '../org_star_def'
import { DraftDat, staticDraftDat, emptyDraftDat,
	toTimeDat, changeStratDraftDat, stratNameDraftDat, isCompleteDraftDat } from './draft_dat'
import { EditObj } from './edit_perm' 
import { NameCell } from './rx_star_cell'
import { CellAct } from './rx_star_row'
import { ValidDat, EditCell, InputCell, dirtyDat, nullValidDat, newValidDat } from './rx_edit_cell'
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
	"grid": SGrid<[DraftDat, number, number]>
};

function newDraftState(): DraftState
{
	return { "grid": {} };
}

function isEmptyDS(ds: DraftState): boolean
{
	return Object.entries(ds.grid).length === 0;
}

function cleanupDS(timeRow: TimeRow, ds: DraftState): DraftState
{
	var newDS = newDraftState();
	for (const [k, _dat] of Object.entries(ds.grid)) {
		var [dat, i, j] = _dat;
		// cell cleanup happens if not scheduled for deletion and
		// - cell text is empty
		// - if old time exists + new time has time + link + note unchanged
		var timeDat = lookupTimeRow(timeRow, i, j);
		/*var toClean = false;
		if (dat.text === "") toClean = true;
		else if (timeDat !== null && formatTime(timeDat.rawTime) === dat.text &&
			timeDat.note === dat.note && timeDat.link === dat.link) toClean = true;
		if (!toClean || dat.delFlag !== null) newDS.grid[k] = _dat;*/
		if (dirtyDat(timeDat, dat)) newDS.grid[k] = _dat;
	}
	return newDS;
}

function updateDS(ds: DraftState, colId: number, subRowId: number, v: DraftDat): DraftState
{
	setGrid(ds.grid, colId, subRowId, [v, colId, subRowId]);
	return { "grid": ds.grid };
}

function updateLocDS(ds: DraftState, colId: number, subRowId: number, f: (a: DraftDat) => DraftDat): DraftState
{
	var _draftDat = lookupGrid(ds.grid, colId, subRowId);
	if (_draftDat !== null) {
		var [draftDat, i, j] = _draftDat;
		var newDat = f(draftDat);
		setGrid(ds.grid, colId, subRowId, [newDat, colId, subRowId]);
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
		var curDat= lookupGrid(ds.grid, colId, draftHeight);
		if (curDat === null || curDat[0].text === "") return draftHeight;
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

function lookupRawDraftDS(ds: DraftState, colId: number, subRowId: number): DraftDat | null
{
	var dat = lookupGrid(ds.grid, colId, subRowId);
	if (dat === null) return null;
	return dat[0];
}

function lookupViewDraftDS(timeRow: TimeRow,
	ds: DraftState, colId: number, subRowId: number): DraftDat | null
{
	// check if draft already exists
	var draftDat = lookupGrid(ds.grid, colId, subRowId);
	if (draftDat !== null) return draftDat[0];
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
	if (draftDat !== null) return [draftDat[0], null];
	// otherwise, see if a time has been stored
	var timeDat = lookupTimeDat(timeRow, colId, subRowId);
	if (timeDat !== null) {
		// if it has, create a static var space based on the time dat			
		var newDat = staticDraftDat(timeDat);
		//newDat.text = "";
		return [newDat, updateDS(ds, colId, subRowId, newDat)];
	}
	// otherwise, initialize row definition from [default strat + variant space]
	var stratDef = defStratColConfig(cfg, colId);
	var newDat = emptyDraftDat(stratDef.vs);
	return [newDat, updateDS(ds, colId, subRowId, newDat)];
}

	/*
		validation
	*/

type ValidMap = SGrid<ValidDat>;

export function validateDS(starDef: StarDef, timeRow: TimeRow, ds: DraftState): [ValidMap, ValidStyle, string | null] {
	// empty check
	var validMap: ValidMap = {};
	var ds = cleanupDS(timeRow, ds);
	if (isEmptyDS(ds)) return [validMap, "init", "No modifications."];
	// build validation map
	for (const [k, _draftDat] of Object.entries(ds.grid)) {
		var [draftDat, i, j] = _draftDat;
		var oldDat = lookupTimeRow(timeRow, i, j);
		var vDat = newValidDat(starDef, timeRow, oldDat, draftDat);
		setGrid(validMap, i, j, vDat);
		/*if (!validTime(_draftDat[0].text)) {
			return ["error", "Must fix invalid times."];
		}*/
	}
	// error info
	for (const [k, vDat] of Object.entries(validMap)) {
		if (!vDat.valid) return [validMap, "error", "Must fix invalid times."];
	}
	for (const [k, vDat] of Object.entries(validMap)) {
		if (!vDat.complete) return [validMap, "error", "Some submissions have incomplete variant information."];
	}
	for (const [k, vDat] of Object.entries(validMap)) {
		if (vDat.proper === "improper") return [validMap, "error", "Time submissions must improve on old ones."];
	}
	var warnFlag = false;
	for (const [k, vDat] of Object.entries(validMap)) {
		for (const [tDat, prop] of vDat.properAll) {
			warnFlag = true;
			if (prop === "improper") return [validMap, "error",
				"Some submissions have times in other cells w/ the same strat variation w/out time improvement."];
		}
	}
	if (warnFlag) return [validMap, "warning", "Some submissions have times in other cells w/ the same strat variation."];
	for (const [k, vDat] of Object.entries(validMap)) {
		if (vDat.proper === "fix") return [validMap, "warning", "Highlighted submissions will modify link/note for previous submission."];
	}
	return [validMap, "valid", "Ready to submit."];
}

export function convertDS(timeRow: TimeRow, ds: DraftState, verOffset: VerOffset): [TimeDat[], TimeDat[]] {
	var ds = cleanupDS(timeRow, ds);
	var timeList: TimeDat[] = [];
	var delList: TimeDat[] = [];
	for (const [k, _draftDat] of Object.entries(ds.grid)) {
		var [draftDat, i, j] = _draftDat;
		// delete case
		if (draftDat.delFlag !== null) {
			delList.push(draftDat.delFlag);
			continue;
		}
		var timeDat = toTimeDat(draftDat, verOffset);
		if (timeDat === null) continue;
		// edit case
		var oldDat = lookupTimeRow(timeRow, i,  j);
		if (oldDat !== null && oldDat.time === timeDat.time) delList.push(oldDat);
		// submit case
		timeList.push(timeDat);
	}
	return [timeList, delList];
}

	/* edit row: displays
		- all submitted times w/ version + variant information
		- slots for un-submitted times
		- "edit toolbar" w/ submission button, warning msgs, version / variant options
		- auto-creates new boxes when necessary
	*/

type EditRowProps = {
	"cfg": ColConfig,
	"userDat": UserDat,
	"pd": PlayData,
	"verOffset": VerOffset,
	"rowId": number | null,
	"showRowId": boolean,
	"editObj": EditObj,
	"editPos": EditPos,
	"cellClick": (a: CellAct, i: number | null, j: number, k: number) => void,
	"submit": (timeList: TimeDat[], delList: TimeDat[]) => void
}

export function EditRow(props: EditRowProps): React.ReactNode {
	const cfg = props.cfg;
	const userDat = props.userDat;
	const pd = props.pd;
	const verOffset = props.verOffset;
	const timeRow = userDat.timeRow;
	const rowId = props.rowId;
	const showRowId = props.showRowId;
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
	useEffect(() => { setDS(cleanupDS(timeRow, ds)); }, [editPos]);

	// get the current draft cell being edited
	var [draftDat, newDS] = lookupEditDraftDS(cfg, starDef, timeRow, ds, editPos.colId, editPos.subRowId);
	if (newDS !== null) setDS(newDS);

	// get current variant space
	var vs = varSpaceStarDef(starDef, stratNameDraftDat(draftDat));
	if (vs === null) throw('Attempting to work on non-existent strat ' + stratNameDraftDat(draftDat) + '.');
	
	// validation
	var [validMap, style, infoText] = validateDS(starDef, timeRow, ds);

	// generate edit cells
	var editNodes: React.ReactNode[] = [];
	var [height, hList] = heightDS(timeRow, ds);
	var dispHeight = height + 1;
	for (let j = 0; j < height + 1; j++) {
		var rowNodes: React.ReactNode[] = [];
		for (let i = 0; i < timeRow.length; i++) {
			// input cell case
			if (editPos.colId === i && editPos.subRowId === j) {
				var vDat = lookupGrid(validMap, i, j);
				if (vDat === null) vDat = nullValidDat();
				rowNodes.push(<InputCell validDat={ vDat } draftDat={ draftDat }
					onWrite={ (v) => editLoc(editPos.colId, j, (dat) => { dat.text = v; return dat; }) } key={ i }/>);
				continue;
			}
			// display case
			var draftDatN = lookupViewDraftDS(timeRow, ds, i, j);
			if (draftDatN !== null || j === hList[i]) {
				// make edit cell
				var vDat = lookupGrid(validMap, i, j);
				if (vDat === null) vDat = nullValidDat();
				rowNodes.push(<EditCell validDat={ vDat } draftDat={ draftDatN } verOffset={ verOffset }
					onClick={ () => cellClick("edit", rowId, i, j) } key={ i }/>);
			} else {
				rowNodes.push(<td className="dark-cell" key={ i } colSpan={ 2 }></td>);
			}
		}
		// player name cell
		var nameAct: CellAct = "none";
		if (hasSubRows(timeRow)) nameAct="view-toggle";
		if (j === 0) rowNodes.unshift(<NameCell id={ userDat.id } pd={ pd } active={ nameAct !== "none" }
			onClick={ () => cellClick(nameAct, rowId, -1, j) } key="name"/>);
		else rowNodes.unshift(<td className="dark-cell" key="name"></td>);
		editNodes.push(<tr className="time-row" key={ j }>{ rowNodes }</tr>);
		// numeric cell
		if (showRowId && rowId !== null) {
			if (j === 0) rowNodes.unshift(<td className="time-cell" key="num">{ rowId + 1 }</td>);
			else rowNodes.unshift(<td className="dark-cell" key="num"></td>);
		}
	}

	var oldDat = lookupTimeRow(timeRow, editPos.colId, editPos.subRowId);
	const delToggle = () => {
		editLoc(editPos.colId, editPos.subRowId, (curDat) => {
			if (curDat.delFlag === null) curDat.delFlag = oldDat;
			else curDat.delFlag = null;
			return curDat;
		});
	};

	// return final row
	return <React.Fragment>
		{ editNodes }
		<tr className="time-row" key="edit-info-row">
			<td></td>
			<td className="submit-area" colSpan={ timeRow.length * 2 }>
				<EditSubmitArea starDef={ starDef } cfg={ cfg } colId={ editPos.colId } vs={ vs }
					curDat={ draftDat } oldDat={ oldDat }
					editDat={ (f) => editLoc(editPos.colId, editPos.subRowId, f) }
					changeStrat={ changeStrat } submit={ () => {
						var [timeList, delList] = convertDS(timeRow, ds, verOffset);
						props.submit(timeList, delList);
					} }
					cancel={ () => cellClick("stop-edit", null, 0, 0) } delToggle={ delToggle }
					style={ style } infoText={ infoText }/>
			</td>
		</tr>
	</React.Fragment>;
}
