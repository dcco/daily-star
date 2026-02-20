
import { VerF, Ver, Variant, VariantMap, VarSpace, vtagVarList, vtagVarMap,
	isCompleteVarMap, toListVarMap, defVerVarSpace } from '../variant_def'
import { RowDef, newRowDef } from '../row_def'
import { TimeDat, VerOffset, rawMS, formatTime, newTimeDat, applyVerOffset } from '../time_dat'

	/*
		draft_row: two choices, either static (for viewing/editing already existing times),
			or dynamic (for submitting new times)
		  * name: current strat name
		  * ver: version ("both" if version is not relevant)
		  * variantSel: stores currently selected variants
	*/

type StaticRow = {
	"dyn": false,
	"def": RowDef
};

type DynRow = {
	"dyn": true,
	"name": string,
	"sheet": string,
	"ver": Ver,
	"variantSel": VariantMap
}

export type RowInfo = StaticRow | DynRow;

function staticRow(def: RowDef): RowInfo {
	return { "dyn": false, "def": def };
}

function dynRow(name: string, sheet: string, ver: Ver, sel: VariantMap): RowInfo {
	return { "dyn": true, "name": name, "sheet": sheet, "ver": ver, "variantSel": sel };
}

function toRowDef(rowInfo: RowInfo): RowDef {
	if (rowInfo.dyn) {
		return newRowDef(rowInfo.name, rowInfo.sheet, rowInfo.ver, toListVarMap(rowInfo.variantSel));
	}
	return rowInfo.def;
}

	/*
		draft_dat: similar to a time_dat, but modified for editing purposes.
			(unfolds the row definition to know more about the variant information)
		  * text: the raw text held in the cell (may not be a valid time)
		  * link: current link URL input (if any)
		  * note: current note (if any)
		  * row: stores row information
		  * verifFlag: verification status
		  * delFlag: cell scheduled for deletion
	*/

export type DraftDat = {
	"text": string,
	"link": string,
	"note": string,
	"rowInfo": RowInfo,
	"verifFlag": string,
	"delFlag": TimeDat | null
};

export function toTimeDat(draftDat: DraftDat, verOffset: VerOffset): TimeDat | null {
	if (draftDat.delFlag !== null) return draftDat.delFlag;
	var time = rawMS(draftDat.text);
	if (draftDat.text === "" || time === null) return null;
	var rowDef = toRowDef(draftDat.rowInfo);
	var timeDat = newTimeDat(time, draftDat.link, draftDat.note, null, draftDat.verifFlag, rowDef);
	applyVerOffset(timeDat, verOffset);
	return timeDat;
}

export function staticDraftDat(timeDat: TimeDat): DraftDat {
	var link = (timeDat.link === null ? "" : timeDat.link);
	var note = (timeDat.note === null ? "" : timeDat.note);
	var verifFlag = (timeDat.verifFlag === null ? "no" : timeDat.verifFlag);
	var rowDef = timeDat.rowDef;
	return {
		"text": formatTime(timeDat.rawTime),
		"link": link,
		"note": note,
		"rowInfo": staticRow(timeDat.rowDef),
		"verifFlag": verifFlag,
		"delFlag": null
	};
}

export function emptyDraftDat(vs: VarSpace): DraftDat {
	return {
		"text": "",
		"link": "",
		"note": "",
		"rowInfo": dynRow(vs.stratName, "none", defVerVarSpace(vs), {}),
		"verifFlag": "no",
		"delFlag": null
	};
}

export function changeStratDraftDat(vs: VarSpace, ds: DraftDat): DraftDat {
	var newDat = emptyDraftDat(vs);
	newDat.text = ds.text;
	newDat.link = ds.link;
	newDat.note = ds.note;
	return newDat;
}

export function stratNameDraftDat(dat: DraftDat): string {
	if (dat.rowInfo.dyn) return dat.rowInfo.name;
	else return dat.rowInfo.def.name;
}

export function verDraftDat(dat: DraftDat): Ver {
	if (dat.rowInfo.dyn) return dat.rowInfo.ver;
	else return dat.rowInfo.def.ver;
}

export function getVarDraftDat(dat: DraftDat, groupName: string): Variant | null {
	// static row / variant list case
	if (!dat.rowInfo.dyn) {
		var rowVarList = dat.rowInfo.def.variant_list;
		for (const [vId, group] of rowVarList) {
			if (group === groupName) return [vId, group];
		}
		return null;
	}
	// dynamic row / variant selector case
	var rowVarSel = dat.rowInfo.variantSel;
	if (rowVarSel[groupName]) return rowVarSel[groupName];
	return null;
}

export function vtagDraftDat(draftDat: DraftDat): string {
	var rowInfo = draftDat.rowInfo;
	if (!rowInfo.dyn) {
		var rowDef = rowInfo.def;
		return rowDef.name + "_" + rowDef.ver + vtagVarList(rowDef.variant_list);
	}
	return rowInfo.name + "_" + rowInfo.ver + vtagVarMap(rowInfo.variantSel);
}

export function setVerDraftDat(dat: DraftDat, ver: VerF) {
	if (!dat.rowInfo.dyn) throw("Attempted to set version on static draft datum.");
	dat.rowInfo.ver = ver;
}

export function setVarDraftDat(dat: DraftDat, group: string, i: number) {
	if (!dat.rowInfo.dyn) throw("Attempted to set variant on static draft datum.");
	dat.rowInfo.variantSel[group] = [i, group];
}

export function setVerifDraftDat(dat: DraftDat, verifFlag: string) {
	dat.verifFlag = verifFlag;
}

export function isCompleteDraftDat(vs: VarSpace, dat: DraftDat): boolean {
	var rowInfo = dat.rowInfo;
	if (!rowInfo.dyn) return true;
	return isCompleteVarMap(vs, rowInfo.variantSel);
}