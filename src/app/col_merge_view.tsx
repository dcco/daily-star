
import { StratDef, ColList } from './org_strat_def'

	/*
		merge_view: an abstract data structure representing combinations
		 of columns that we want to view as a single column.

		* id: representative strat name
		* header: strat name with disambiguating tags cut-off (re: "Open" vs "Open#Alt")
		* partList: an array of lists of [column id, strat def] pairs, each representing a "merged" column.
	*/

type StratDefEx = {
	"def": StratDef,
	"header": string,
	"neg": string[],
	"pos": string[]
};

type ColRef = [number, StratDefEx]

type MergeCol = {
	"id": string,
	"headerList": string[],
	"partList": ColRef[]
};

export type MergeView = {
	"colList": MergeCol[]
};

export function newMergeView(colList: ColList): MergeView
{
	return {
		"colList": colList.map((strat) => {
			var stratEx: StratDefEx = { "def": strat[1], "header": strat[1].name, "neg": [], "pos": [] };
			return { "id": strat[1].name, "headerList": [strat[1].name.split("#")[0]], "partList": [[strat[0], stratEx]] }
		})
	};
}

export function findColMergeView(mv: MergeView, id: string): [number, MergeCol] | null
{
	for (let i = 0; i < mv.colList.length; i++) {
		var mCol = mv.colList[i];
		if (mCol.id === id) return [i, mCol];
		/*for (const [colId, strat] of mCol.partList) {
			if (strat.name === name) return [i, mCol];
		}*/
	}
	return null;
}

export function findColByHeaderMergeView(mv: MergeView, h: string): [number, MergeCol] | null
{
	for (let i = 0; i < mv.colList.length; i++) {
		var mCol = mv.colList[i];
		if (mCol.headerList.includes(h)) return [i, mCol];
	}
	return null;
}

export function findHeaderMergeView(mv: MergeView, id: string): string[] | null
{
	var res = findColMergeView(mv, id);
	if (res === null) return null;
	return res[1].headerList;
}

export function removeColMergeView(mv: MergeView, id: string): MergeCol
{
	var res = findColMergeView(mv, id);
	if (res === null) throw ("Attempted to remove non-existent column " + id + " from merge view.");
	var [i, mCol] = res;
	//if (mCol.partList.length !== 1) throw ("Attempted to remove composite column " + mCol.header + " from merge view.");
	mv.colList.splice(i, 1);
	return mCol;
}

export function removeColByHeaderMergeView(mv: MergeView, h: string): MergeCol
{
	var res = findColByHeaderMergeView(mv, h);
	if (res === null) throw ("Attempted to remove non-existent column header " + h + " from merge view.");
	var [i, mCol] = res;
	//if (mCol.partList.length !== 1) throw ("Attempted to remove composite column " + mCol.header + " from merge view.");
	mv.colList.splice(i, 1);
	return mCol;
}

export function addColMergeView(mv: MergeView, id: string, col: MergeCol)
{
	var res = findColMergeView(mv, id);
	if (res === null) throw ("Attempted to combine column " + col.id + " with non-existent column " + id + " in merge view.");
	var [i, _s] = res;
	mv.colList[i].partList = mv.colList[i].partList.concat(col.partList);
	//mv.colList[i].partList.push(strat);
}

export function addColByHeaderMergeView(mv: MergeView, h: string, col: MergeCol)
{
	var res = findColByHeaderMergeView(mv, h);
	if (res === null) throw ("Attempted to combine column header " + col.headerList.join('/') + " with non-existent column header " + h + " in merge view.");
	var [i, _s] = res;
	mv.colList[i].partList = mv.colList[i].partList.concat(col.partList);
	//mv.colList[i].partList.push(strat);
}

export function mergeColMergeView(mv: MergeView, n1: string, n2: string)
{
	if (n1 === n2) return;
	var res = findColMergeView(mv, n2);
	if (res === null) return;
	var mCol = removeColMergeView(mv, n2);
	addColMergeView(mv, n1, mCol);
}

export function mergeColByHeaderMergeView(mv: MergeView, n1: string, n2: string)
{
	if (n1 === n2) return;
	var res = findColByHeaderMergeView(mv, n2);
	if (res === null) return;
	var mCol = removeColByHeaderMergeView(mv, n2);
	addColByHeaderMergeView(mv, n1, mCol);
}

export function splitColMergeView(mv: MergeView, id: string, vName: string, h1: string, h2: string)
{
	var oldCol = removeColMergeView(mv, id);
	if (oldCol === null) throw ("Attempted to split non-existent column " + id + " in merge view.");
	var pl1: ColRef[] = oldCol.partList.map((ref) => {
		var [id, strat] = ref;
		var newNeg = strat.neg.map((v) => v);
		newNeg.push(vName);
		return [id, { "def": strat.def, "header": h1, "neg": newNeg, "pos": strat.pos }];
	})
	var pl2: ColRef[] = oldCol.partList.map((ref) => {
		var [id, strat] = ref;
		var newPos = strat.pos.map((v) => v);
		newPos.push(vName);
		return [id, { "def": strat.def, "header": h2, "neg": strat.neg, "pos": newPos }];
	})
	var c1: MergeCol = { "id": id, "headerList": [h1], "partList": pl1 };
	var c2: MergeCol = { "id": id, "headerList": [h2], "partList": pl2 };

	mv.colList.push(c1);
	mv.colList.push(c2);
}

export function renameColMergeView(mv: MergeView, oldId: string, newId: string, header: string)
{
	var res = findColMergeView(mv, oldId);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	mCol.headerList = [header];
}

export function renameListColMergeView(mv: MergeView, oldId: string, newId: string, headerList: string[])
{
	var res = findColMergeView(mv, oldId);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	mCol.headerList = headerList;
}

export function addNameColMergeView(mv: MergeView, oldId: string, newId: string, header: string)
{
	var res = findColMergeView(mv, oldId);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	if (!mCol.headerList.includes(header)) mCol.headerList.push(header);
}

export function addNLColMergeView(mv: MergeView, oldId: string, newId: string, headerList: string[])
{
	var res = findColMergeView(mv, oldId);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	for (const header of headerList) {
		if (!mCol.headerList.includes(header)) mCol.headerList.push(header);
	}
}

/*
export function renameColByHeaderMergeView(mv: MergeView, oldHeader: string, newId: string, header: string)
{
	var res = findColByHeaderMergeView(mv, oldHeader);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	mCol.header = header;
}*/

export function addNameColByHeaderMergeView(mv: MergeView, oldHeader: string, newId: string, header: string)
{
	var res = findColByHeaderMergeView(mv, oldHeader);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	mCol.headerList.push(header);
}