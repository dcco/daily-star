
import { VerF, Ver, RowDef, newRowDef } from './strat_def'
import { TimeDat, VerOffset, rawMS, formatTime, newTimeDat, applyVerOffset } from './time_dat'
import { VariantSel, VarSpace, toVarList, defVerVarSpace, toVarSel } from './org_variant'

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
	"ver": Ver,
	"variantSel": VariantSel
}

export type RowInfo = StaticRow | DynRow;

function staticRow(def: RowDef): RowInfo {
	return { "dyn": false, "def": def };
}

function dynRow(name: string, ver: Ver, sel: VariantSel): RowInfo {
	return { "dyn": true, "name": name, "ver": ver, "variantSel": sel };
}

function toRowDef(rowInfo: RowInfo) {
	if (rowInfo.dyn) {
		return newRowDef(rowInfo.name, rowInfo.ver, toVarList(rowInfo.variantSel));
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
		  * delFlag: cell scheduled for deletion
	*/

export type DraftDat = {
	"text": string,
	"link": string,
	"note": string,
	"rowInfo": RowInfo,
	"delFlag": TimeDat | null
};

export function toTimeDat(draftDat: DraftDat, verOffset: VerOffset): TimeDat | null {
	if (draftDat.delFlag !== null) return draftDat.delFlag;
	var time = rawMS(draftDat.text);
	if (draftDat.text === "" || time === null) return null;
	var rowDef = toRowDef(draftDat.rowInfo);
	var timeDat = newTimeDat(time, draftDat.link, draftDat.note, rowDef);
	applyVerOffset(timeDat, verOffset);
	return timeDat;
}

export function staticDraftDat(timeDat: TimeDat): DraftDat {
	var link = (timeDat.link === null ? "" : timeDat.link);
	var note = (timeDat.note === null ? "" : timeDat.note);
	var rowDef = timeDat.rowDef;
	return {
		"text": formatTime(timeDat.time),
		"link": link,
		"note": note,
		"rowInfo": staticRow(timeDat.rowDef),
		"delFlag": null
	};
}

export function emptyDraftDat(vs: VarSpace): DraftDat {
	return {
		"text": "",
		"link": "",
		"note": "",
		"rowInfo": dynRow(vs.stratName, defVerVarSpace(vs), {}),
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

export function verDraftDat(dat: DraftDat): string {
	if (dat.rowInfo.dyn) return dat.rowInfo.ver;
	else return dat.rowInfo.def.ver;
}

export function varSelDraftDat(dat: DraftDat, vId: number, vList: string[]): string | null {
	// static row / variant list case
	if (!dat.rowInfo.dyn) {
		var rowVarList = dat.rowInfo.def.variant_list;
		for (let i = 0; i < vList.length; i++) {
			if (rowVarList.includes(vList[i])) return vList[i];
		}
		return null;
	}
	// dynamic row / variant selector case
	var rowVarSel = dat.rowInfo.variantSel;
	if (rowVarSel["var:" + vId]) return rowVarSel["var:" + vId];
	return null;
}

export function setVerDraftDat(dat: DraftDat, ver: VerF) {
	if (!dat.rowInfo.dyn) throw("Attempted to set version on static draft datum.");
	dat.rowInfo.ver = ver;
}

export function setVarDraftDat(dat: DraftDat, group: number, v: string) {
	if (!dat.rowInfo.dyn) throw("Attempted to set variant on static draft datum.");
	dat.rowInfo.variantSel["var:" + group] = v;
}