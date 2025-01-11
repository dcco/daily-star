
import { StratDef, ColList } from './org_strat_def'

	/*
		merge_view: an abstract data structure representing combinations
		 of columns that we want to view as a single column.

		* list: an array of lists of [column id, strat def] pairs, each representing a "merged" column.
	*/

type ColRef = [number, StratDef];

type MergeCol = {
	"id": string,
	"header": string,
	"partList": ColRef[]
};

export type MergeView = {
	"colList": MergeCol[]
};

export function newMergeView(colList: ColList): MergeView
{
	return {
		"colList": colList.map((strat) => {
			return { "id": strat[1].name, "header": strat[1].name.split("#")[0], "partList": [strat] }
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

export function findHeaderMergeView(mv: MergeView, id: string): string | null
{
	var res = findColMergeView(mv, id);
	if (res === null) return null;
	return res[1].header;
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

export function addColMergeView(mv: MergeView, id: string, col: MergeCol)
{
	var res = findColMergeView(mv, id);
	if (res === null) throw ("Attempted to combine column " + col.id + " with non-existent column " + id + " in merge view.");
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

export function renameColMergeView(mv: MergeView, oldId: string, newId: string, header: string)
{
	var res = findColMergeView(mv, oldId);
	if (res === null) return;
	var [i, mCol] = res;
	mCol.id = newId;
	mCol.header = header;
}