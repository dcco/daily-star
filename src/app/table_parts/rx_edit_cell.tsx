
import { StratDef } from '../org_strat_def'
import { StarDef, varSpaceStarDef } from '../org_star_def'
import { TimeDat, VerOffset, rawMS, formatTime, vtagTimeDat } from '../time_dat'
import { DraftDat, toTimeDat, stratNameDraftDat, vtagDraftDat, isCompleteDraftDat } from './draft_dat'
import { TimeRow } from '../time_table'
import { timeDetail } from './rx_star_cell'

	/*
		validation data: unit of data defining validation state of cell.
			saved as an object so we only need to calculate it once.
			generally set to TRUE when not applicable (empty cell) to avoid displaying superfluous errors. 
		  * valid - time is well-formed
		  * complete - all variants have been filled out 
		  * dirty - time is non-empty + not the same as the old time
		  * proper - time is new or an improvement
	*/

type ProperState = "na" | "improper" | "new" | "fix";

export type ValidDat = {
	"valid": boolean,
	"dirty": boolean,
	"complete": boolean,
	"proper": ProperState,
	"properAll": [TimeDat, ProperState][]
};

export function validTime(s: string): boolean {
	return s.match(/^([0-9]?[0-9]:)?[0-5]?[0-9](\.[0-9][036]?)?$/) !== null;
}

function sameNote(x: string | null, y: string): boolean
{
	if (x === null && y === "") return true;
	return x === y;
}

export function dirtyDat(oldDat: TimeDat | null, draftDat: DraftDat): boolean {
	if (draftDat.delFlag !== null) return true;
	if (draftDat.text === "") return false;
	if (oldDat === null) return true;
	return formatTime(oldDat.rawTime) !== draftDat.text || !sameNote(oldDat.note, draftDat.note) || !sameNote(oldDat.link, draftDat.link);
}

function completeDat(starDef: StarDef, draftDat: DraftDat, dirty: boolean): boolean {
	if (!dirty) return true;
	var vs = varSpaceStarDef(starDef, stratNameDraftDat(draftDat));
	if (vs === null) return false;
	return isCompleteDraftDat(vs, draftDat);
}

function properDat(oldDat: TimeDat | null, draftDat: DraftDat, valid: boolean, dirty: boolean, strict: boolean): ProperState {
	if (oldDat === null || !dirty || !valid) return "na";
	var newTime = rawMS(draftDat.text);
	if (newTime === null) return "na";
	if (newTime < oldDat.rawTime) return "new";
	if (newTime === oldDat.time && !strict &&
		(!sameNote(oldDat.link, draftDat.link) || !sameNote(oldDat.note, draftDat.note))) return "fix";
	return "improper";
}

function properAllDat(timeRow: TimeRow, oldDat: TimeDat | null, draftDat: DraftDat): [TimeDat, ProperState][]
{
	// flatten all time entries
	var tdList: TimeDat[] = [];
	for (const [k, multiDat] of Object.entries(timeRow)) {
		if (multiDat !== null) multiDat.map((timeDat) => tdList.push(timeDat));
	}
	// calculate propriety for all relevant time data
	var propList: [TimeDat, ProperState][] = [];
	for (const timeDat of tdList) {
		if (timeDat !== oldDat && vtagTimeDat(timeDat) === vtagDraftDat(draftDat)) {
			propList.push([timeDat, properDat(timeDat, draftDat, true, true, true)]);
		}
	}
	return propList;
}

export function nullValidDat(): ValidDat {
	return {
		"valid": true,
		"dirty": false,
		"complete": true,
		"proper": "na",
		"properAll": []
	};
}

function delValidDat(): ValidDat {
	return {
		"valid": true,
		"dirty": true,
		"complete": true,
		"proper": "na",
		"properAll": []
	};
}

export function newValidDat(starDef: StarDef, timeRow: TimeRow, oldDat: TimeDat | null, draftDat: DraftDat): ValidDat {
	if (draftDat.delFlag !== null) return delValidDat();
	var valid = validTime(draftDat.text);
	var dirty = dirtyDat(oldDat, draftDat);
	var complete = completeDat(starDef, draftDat, dirty);
	var propList: [TimeDat, ProperState][] = [];
	if (valid && dirty && complete) propList = properAllDat(timeRow, oldDat, draftDat);
	return {
		"valid": valid,
		"dirty": dirty,
		"complete": complete,
		"proper": properDat(oldDat, draftDat, valid, dirty, false),
		"properAll": propList
	};
}

function improperValidDat(vd: ValidDat): boolean {
	if (vd.proper === 'improper') return true;
	for (const [td, prop] of vd.properAll) {
		if (prop === 'improper') return true;
	}
	return false;
}

/*
export function dynDraftDat(vs: VarSpace, timeDat: TimeDat): DraftDat {
	var link = (timeDat.link === null ? "" : timeDat.link);
	var note = (timeDat.note === null ? "" : timeDat.note);
	var rowDef = timeDat.rowDef;
	return {
		"text": formatTime(timeDat.time),
		"link": link,
		"note": note,
		"rowInfo": dynRow(rowDef.name, rowDef.ver, varSelVarSpace(vs, rowDef.variant_list)),
		"delFlag": null
	};
}*/

/*
export function freshDraftDat(timeDat)
{
	return {
		"text": "",
		"link": "",
		"note": "",
		"stratName": timeDat.rowDef.name,
		"ver": timeDat.rowDef.ver,
		"variantMap": {},
		"delFlag": false
	}
}
*/


//function validDraftDat(draftDat) {
	/*if (validTime(draftDat.text)) {
		var vList = toVarList(draftDat.variantMap);
		var rowDef = newRowDef(draftDat.stratName, draftDat.ver, );
	}*/
//	return null;
//}


	/*
		edit cell: displays times for editing purposes
	*/

type EditCellProps = {
	"validDat": ValidDat,
	"draftDat": DraftDat | null,
	"verOffset": VerOffset,
	"onClick": () => void
}

export function EditCell(props: EditCellProps): React.ReactNode {
	var validDat = props.validDat;
	var draftDat = props.draftDat;
	var verOffset = props.verOffset;

	var cellText = "";
	var rawText: string | null = null;
	//var isValid = true;

	// get representative time cell + del flag
	var timeDat: TimeDat | null = null;
	var delFlag = false;
	if (draftDat !== null) {
		if (draftDat.delFlag !== null) {
			timeDat = draftDat.delFlag;
			delFlag = true;
		} else if (validTime(draftDat.text)) {
			timeDat = toTimeDat(draftDat, verOffset);
		} else {
			cellText = draftDat.text;
		}
	}

	// fill out information if time cell exists
	if (timeDat !== null) {
		var [_fText, _rawText] = timeDetail(timeDat, verOffset, false);
		cellText = _fText;
		rawText = _rawText;
	}

	//var complete = completeCell(starDef, draftDat, props.dirty);
	var fErr = "na";
	if (!validDat.complete || improperValidDat(validDat)) fErr = "error";
	else if (validDat.properAll.length > 0 || validDat.proper === "fix") fErr = "warning";

	return (<td className="edit-cell" onClick={ props.onClick }>
		<div className="cell-wrap" data-use={ cellText !== "" } data-del={ delFlag.toString() }
			data-valid={ validDat.valid.toString() } data-err={ fErr.toString() }
			data-dirty={ validDat.dirty.toString() }> { cellText } { rawText }</div></td>);
}

	/* input cell: a special editing cell for when player input is active */

type InputCellProps = {
	"validDat": ValidDat,
	"draftDat": DraftDat,
	"onWrite": (a: string) => void
};

export function InputCell(props: InputCellProps): React.ReactNode {
	var validDat = props.validDat;
	var draftDat = props.draftDat;
	var cellText = draftDat.text;
	/*var isValid = (cellText === "" || validTime(cellText));

	var dirty = (draftDat.text !== "");
	if (props.oldDat !== null && formatTime(props.oldDat.time) === draftDat.text) dirty = false;
	var complete = completeCell(starDef, draftDat, dirty);*/

	// deletion behavior
	var delFlag = false;
	if (draftDat.delFlag !== null) {
		cellText = formatTime(draftDat.delFlag.rawTime);
		delFlag = true;
	}

	// misc error behavior
	var fErr = "na";
	if (!validDat.complete || improperValidDat(validDat)) fErr = "error";
	else if (validDat.properAll.length > 0 || validDat.proper === "fix") fErr = "warning";

	return (<td className="edit-cell" onClick={ () => {} }>
		<div className="cell-wrap">
			<input className="cell-input" value={ cellText } data-del={ delFlag.toString() }
				data-valid={ validDat.valid.toString() } data-err={ fErr.toString() }
				autoFocus onChange={ (e) => { if (!delFlag) props.onWrite(e.target.value) } }></input></div></td>);
}

	/* input cell: */
/*
// -- input box case
	if (props.isInput) {
		innerNode = (<input className="cell-input" value={ props.text } valid={ isValid.toString() }
			dirty={ props.dirty.toString() } onChange={ (e) => props.onWrite(e.target.value) }></input>);
	}
*/
