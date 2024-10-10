
import { formatTime } from './time_dat'

	/*
		variant_map: 
	*/

	/*
		draft_dat: similar to a time_dat, but modified for editing purposes.
			(unfolds the row definition to know more about the variant information)
		  * text: the raw text held in the cell (may not be a valid time)
		  * link: current link URL input (if any)
		  * note: current note (if any)
		  * stratName: current strat name
		  * ver: version ("both" if version is not relevant)
		  * variantMap: stores currently selected variants
		  * delFlag: cell scheduled for deletion
	*/
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

	/*
		validation functions
	*/

export function validTime(s: string): boolean {
	return s.match(/^([0-9]?[0-9]:)?[0-5]?[0-9](\.[0-9][036]?)?$/) !== null;
}

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

export function EditCell(props: {}): React.ReactNode {
	/*var draftDat = props.draftDat;
	var verOffset = props.verOffset;

	var [cellText, rawText] = timeDetail(timeDat, verOffset);
	var isValid = props.cellText === "" || props.valid;
	return (<td className="edit-cell" onClick={ props.onClick }>
		<div className="cell-wrap" valid={ isValid.toString() } dirty={ props.dirty.toString() }>
			{ cellText } { rawText }</div></td>);*/
	return <td className="edit-cell">EDIT</td>;
}

	/* input cell: a special editing cell for when player input is active */
/*
export function InputCell(props) {
	return (<td className="edit-cell" onClick={ () => {} }>
		<div className="cell-wrap" valid={ isValid.toString() }>
			<input className="cell-input" value={ props.text } valid={ isValid.toString() }
				onChange={ (e) => props.onWrite(e.target.value) }></input></div></td>);
}*/

	/* input cell: */
/*
// -- input box case
	if (props.isInput) {
		innerNode = (<input className="cell-input" value={ props.text } valid={ isValid.toString() }
			dirty={ props.dirty.toString() } onChange={ (e) => props.onWrite(e.target.value) }></input>);
	}
*/
