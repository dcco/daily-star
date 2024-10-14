
import { StratDef } from './org_strat_def'
import { VerOffset } from './time_dat'
import { DraftDat, toTimeDat } from './draft_dat'
import { timeDetail } from './rx_star_cell'

	/*
		validation functions
	*/

export function validTime(s: string): boolean {
	return s.match(/^([0-9]?[0-9]:)?[0-5]?[0-9](\.[0-9][036]?)?$/) !== null;
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
	"draftDat": DraftDat | null,
	"verOffset": VerOffset,
	"dirty": boolean,
	"onClick": () => void
}

export function EditCell(props: EditCellProps): React.ReactNode {
	var draftDat = props.draftDat;
	var verOffset = props.verOffset;

	var cellText = "";
	var rawText: string | null = null;
	var isValid = true;

	// fill out information if draft cell exists
	if (draftDat !== null) {
		cellText = draftDat.text;
		var timeDat = toTimeDat(draftDat, verOffset);
		if (cellText !== "") isValid = (validTime(cellText) && timeDat !== null);
		if (validTime(cellText) && timeDat !== null) {
			var [_fText, _rawText] = timeDetail(timeDat, verOffset);
			cellText = _fText;
			rawText = _rawText;
		}
	}

	return (<td className="edit-cell" onClick={ props.onClick }>
		<div className="cell-wrap" data-use={ cellText !== "" }
			data-valid={ isValid.toString() } data-dirty={ props.dirty.toString() }>
			{ cellText } { rawText }</div></td>);
}

	/* input cell: a special editing cell for when player input is active */

type InputCellProps = {
	"draftDat": DraftDat,
	"onWrite": (a: string) => void
};

export function InputCell(props: InputCellProps): React.ReactNode {
	var draftDat = props.draftDat;
	var cellText = draftDat.text;
	var isValid = (cellText === "" || validTime(cellText));

	return (<td className="edit-cell" onClick={ () => {} }>
		<div className="cell-wrap" data-valid={ isValid.toString() }>
			<input className="cell-input" value={ cellText } data-valid={ isValid.toString() } autoFocus
				onChange={ (e) => props.onWrite(e.target.value) }></input></div></td>);
}

	/* input cell: */
/*
// -- input box case
	if (props.isInput) {
		innerNode = (<input className="cell-input" value={ props.text } valid={ isValid.toString() }
			dirty={ props.dirty.toString() } onChange={ (e) => props.onWrite(e.target.value) }></input>);
	}
*/
