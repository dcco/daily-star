import React, { useState } from 'react'

import { TimeDat, VerOffset, formatTime, zeroVerOffset } from '../time_dat'
import { Ident, AuthIdent, TimeTable, keyIdent, dropIdent,
	freshUserDat, hasSubRows, sortTimeTable } from '../time_table'
import { PlayData, strIdNickPD } from '../play_data'
import { ColConfig, headerListColConfig, recordListColConfig, filterTableColConfig } from '../col_config'
import { ExColumn } from './ex_column'
import { EditObj, selfWritePerm, hasWritePerm, checkNewPerm } from './edit_perm'
import { RecordMap } from '../xcam_record_map'
import { TimeCell, RecordCell, NameCell } from './rx_star_cell'
import { CellAct, PlayDB, DataRow } from './rx_star_row'
import { EditRow, nullEditPos } from './rx_edit_row'

	/*
		##########
		STAR TABLE
		##########
		react element designed to display timetable information
		+ optionally provides hooks to modify timetable info
	*/

	// time manipulation

function validName(s: string): boolean {
	return s.match(/^[a-zA-Z0-9 _]+$/) !== null;
}

type ViewState = {
	"rowId": number | null	
}

function nullViewState(): ViewState {
	return {
		"rowId": null
	};
}

	/*
		star table: displays times from a time table
		* cfg - column display configuration
		* recordMap - record data for the time table
		* timeTable - time table
		* verOffset - version offset for time display
		* emptyWarn - warn if all rows are empty (outside of editing mode)
		* editObj - params for editable tables
		
		* playData - player viewing the table
		* playDB - information about players
		* rankKey - key used for assigning ranks to times
	*/

type StarTableProps = {
	"cfg": ColConfig,
	"verOffset"?: VerOffset,
	"recordMap": RecordMap,
	"timeTable": TimeTable,
	"playData": PlayData,
	"emptyWarn"?: boolean,
	"editObj"?: EditObj,
	"playDB"?: PlayDB,
	"rankKey"?: string,
	"extraColList"?: ExColumn[]
}

const LB_NUM = false;

export function StarTable(props: StarTableProps): React.ReactNode {
	var cfg = props.cfg;
	var stratTotal = cfg.stratTotal;
	var recordMap = props.recordMap;
	var timeTable = props.timeTable;
	var playData = props.playData;

	var editObj: EditObj | null = null;
	if (props.editObj !== undefined) editObj = props.editObj;

	var verOffset = zeroVerOffset();
	if (props.verOffset !== undefined) verOffset = props.verOffset;

	var exColList: ExColumn[] = [];
	if (props.extraColList !== undefined) exColList = props.extraColList;
	const exTotal = exColList.length;

	// sort state
	const [sortId, setSortId] = useState(0);

	// view state
	const [vState, setVState] = useState(nullViewState());

	// view functions
	const viewClick = (row: number) => {
		if (vState.rowId !== row) {
			setVState({ rowId: row });
		} else {
			setVState({ rowId: null });
		}
		if (editPos.active) setEditPos(nullEditPos());
	};

	// edit state
	const [editPos, setEditPos] = useState(nullEditPos());

	// edit functions
	const editClick = (row: number | null, col: number, subRow: number) => {
		setEditPos({
			active: true,
			rowId: row,
			colId: col,
			subRowId: subRow
		});
		if (vState.rowId !== null) setVState({ rowId: null });
	};

	const cellClick = (action: CellAct, row: number | null, col: number, subRow: number) => {
		if (action === "edit") editClick(row, col, subRow);
		else if (action === "stop-edit") setEditPos(nullEditPos());
		else if (action === "view-toggle" && row !== null) viewClick(row);
	}

	const editSubmit = (id: Ident, timeList: TimeDat[], delList: TimeDat[], verifList: TimeDat[]) => {
		setEditPos(nullEditPos());
		//editTT(editText[0], diffText(eState.oldText, editText), colList);
		if (editObj !== null) editObj.updateTT(id, timeList, delList, verifList);
	};

	/* ----- WIDTH ------
		right now, colNodes isnt doing anything, but left as a stub for future use
	*/
	const STRAT_WEIGHT = 15;
	const EX_WEIGHT = 6;
	var unitWidth = 85 / ((STRAT_WEIGHT * stratTotal) + (EX_WEIGHT * exTotal));
	var stratWidth = "" + Math.floor(STRAT_WEIGHT * unitWidth) + "%";
	var exWidth = "" + Math.floor(EX_WEIGHT * unitWidth) + "%";
	var colNodes: React.ReactNode[] = [<col key="a" width="15%"/>];
	/*
	var xdWidth = Math.floor(85 / stratTotal);
	var tdWidth = "" + xdWidth + "%";
	if (LB_NUM) colNodes.unshift(<col key="k" width="4%"/>);
	for (const exCol of exColList) {
		colNodes.push(<col key={ exCol.key }/>);
	}*/
	/* for (let i = 0; i < stratTotal; i++) {
		colNodes.push(<col width={ "" + (xdWidth * 0.55) + "%" }/>);
		colNodes.push(<col width={ "" + (xdWidth * 0.45) + "%" }/>);
	}*/

	/* ----- TABLE HEADER ----- */

	var sortActive = !editPos.active;
	// -- was 77% with "extra"
	var headerList = headerListColConfig(cfg);
	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);

	var headerNodes: React.ReactNode[] = headerList.map((header, i) => {
		var hNew: React.ReactNode[] = header.map((h) => h);
		if (hNew.length > 1) hNew = hNew.map((h, i) => {
			var c = String.fromCharCode(i + 97);
			if (i !== 0) return <React.Fragment key={ i }>/{ h }<sup data-k={ c }>{ c }</sup></React.Fragment>;
			return <React.Fragment key={ i }>{ h }<sup data-k={ c }>{ c }</sup></React.Fragment>;
		});
		return (<td className="time-cell" key={ header[0] + "_" + i } colSpan={ 2 } data-active={ sortActive.toString() } width={ stratWidth }
			onClick={ () => { if (sortActive) setSortId(i + 1) } }>{ hNew } { imgNodeFun(sortId === i + 1) }</td>);
	});
	headerNodes.unshift(<td className="time-cell" key="strat"  data-active={ sortActive.toString() } width="15%"
		onClick={ () => setSortId(0) }>Strat { imgNodeFun(sortId === 0) }</td>);
	if (LB_NUM) headerNodes.unshift(<td className="time-cell" key="#" width="5%">#</td>)
	for (const exCol of exColList) {
		headerNodes.push(<td className="time-cell" width={ exWidth } key={ exCol.key }>{ exCol.name }</td>);
	}

	/* ----- RECORD ROW ----- */

	var recordList = recordListColConfig(cfg, recordMap);
	var recordNodes = recordList.map((record, i) => {
		return <RecordCell timeDat={ record } verOffset={ verOffset } key={ record.rowDef.name + "_" + i }/>;
	});
	recordNodes.unshift(<td className="record-cell" key="wr">Sheet Best</td>);
	if (LB_NUM) recordNodes.unshift(<td className="time-cell" key="#"></td>);
	for (const exCol of exColList) {
		recordNodes.push(<td className="time-cell" key={ exCol.key }></td>);
	}

	/* ----- TIME TABLE ROWS ----- */
	// filter table by colums + sort table data
	var filterTable = filterTableColConfig(timeTable, cfg);
	if (sortId > stratTotal) setSortId(0);
	filterTable = sortTimeTable(filterTable, sortId);

	// build time table
	var timeTableNodes = [];
	filterTable.map((userDat, i) => {
		// -- edit row case
		if (editObj !== null && editPos.active && editPos.rowId === i) {
			if (hasWritePerm(editObj.perm, userDat.id)) {
				timeTableNodes.push(<EditRow cfg={ cfg } userDat={ userDat } pd={ playData } verOffset={ verOffset }
					rowId={ i } editObj={ editObj } editPos={ editPos } cellClick={ cellClick }
					submit={ editSubmit } showRowId={ LB_NUM } extraColList={ exColList } key="edit"></EditRow>);
				// if we lost editing permissions, exit immediately
			} else { setEditPos(nullEditPos()); }
			return;
		}
		// -- normal row case
		// click action
		var action: CellAct = "none"
		if (editObj !== null && hasWritePerm(editObj.perm, userDat.id)) action = "edit";
		else if (hasSubRows(userDat.timeRow)) action = "view-toggle";
		// special CSS for last row
		var endRow = i !== timeTable.length - 1;
		// add row
		timeTableNodes.push(<DataRow userDat={ userDat } pd={ playData } verOffset={ verOffset } rowId={ i } showRowId={ LB_NUM }
			expand={ vState.rowId === i } action={ action } onClick={ cellClick } endRow={ endRow } headerList={ headerList }
			key={ keyIdent(userDat.id) } playDB={ props.playDB } rankKey={ props.rankKey } extraColList={ exColList }/>);
	});

	if (props.emptyWarn && editObj === null && timeTableNodes.length === 0) {
		timeTableNodes.push(<tr key="ext-special"><td className="time-special-note" colSpan={ headerNodes.length }>
			Extensions-Only Star (Toggle Extensions On)
		</td></tr>);
	}

	/* ----- INITIAL SUBMIT ROW ----- */
	
	// determine whether user can submit a new time
	var canSubmitNew = true;
	var newPerm: AuthIdent | null = null;
	if (editObj !== null) {
		if (editObj.perm.newId !== null) newPerm = editObj.perm.newId;
		for (const userDat of filterTable) {
			if (selfWritePerm(editObj.perm, userDat.id)) {
				canSubmitNew = false;
				break;
			}
		}
	}

	// build initial submit row
	// -- normal case
	if (canSubmitNew && newPerm !== null && (!editPos.active || editPos.rowId !== null)) {
		var exRowNodes: React.ReactNode[] = [];
		for (let i = 0; i < stratTotal; i++) {
			exRowNodes.push(<td className="init-cell" key={ i } colSpan={ 2 } 
				onClick={ () => editClick(null, i, 0) }></td>);
		}
		var nText = strIdNickPD(playData, dropIdent(newPerm));
		//if (nText === "@me") nText = "New";
		exRowNodes.unshift(<td className="init-cell" key="name"
			onClick={ () => editClick(null, 0, 0) }><i>{ nText }</i></td>);
		if (LB_NUM) exRowNodes.unshift(<td className="init-cell" key="num" onClick={ () => editClick(null, 0, 0) }>-</td>);
		for (const exCol of exColList) {
			exRowNodes.push(<td className="init-cell" key={ exCol.key } onClick={ () => editClick(null, 0, 0) }></td>);
		}
		//exRowNodes.push(<td className="misc-cell" key="act"></td>);
		timeTableNodes.push(<tr className="time-row" key="init-submit">{ exRowNodes }</tr>);
	// -- edit case
	} else if (editPos.active && editPos.rowId === null) {
		if (newPerm !== null) {
			if (editObj === null) throw ("BUG: Entered edit state without edit mode object.");
			var newDat = freshUserDat(stratTotal, dropIdent(newPerm));
			timeTableNodes.push(<EditRow cfg={ cfg } userDat={ newDat } pd={ playData } verOffset={ verOffset }
				rowId={ null } showRowId={ LB_NUM } editObj={ editObj } editPos={ editPos } cellClick={ cellClick }
				submit={ editSubmit } extraColList={ exColList } key="edit"></EditRow>);
			// if we lost editing permission, exit immediately
		} else { setEditPos(nullEditPos()); }
	}

	return (
		<div>
		<div className="table-cont">
			<table className="time-table">
			<colgroup>{ colNodes }</colgroup>
			<tbody>
				<tr className="time-row" key="header">{ headerNodes }</tr>
				<tr className="time-row" key="record">{ recordNodes }</tr>
				{ timeTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}