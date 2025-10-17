
import { StratDef, ColList, filterVarColList } from './org_strat_def'
import { StarDef, FilterState } from './org_star_def'
import { TimeDat, MultiDat, maxTimeDat } from './time_dat'
import { TimeTable, filterTimeTable } from './time_table'
import { RecordMap } from './xcam_record_map'
import { MergeView, newMergeView, findColMergeView, findColByHeaderMergeView, findHeaderMergeView,
	mergeColMergeView, mergeColByHeaderMergeView, splitColMergeView,
	addNameColMergeView, renameColMergeView, renameListColMergeView,
	addNLColMergeView, addNameColByHeaderMergeView } from './col_merge_view'

	/*
		* how does the open column work?
		fundamentally split into the following cases:
		-- open list does not exist - no merge view is given
		-- open list is empty, open xcam row does not exist - open column is not acknowledged
		-- open list is non-empty, open xcam row does not exist - open strats merged into leftmost column
		-- open xcam row exists - other open strats merged into the open column

		edit: now that star definition has been refactored, we dont need to be as mindful
			during the merge view configuration. it should suffice to create the columns
			normally and merge whatever is in the list of open columns. notably, we no longer
			need to virtually track the open column
	*/

	/* 
		col_config: bundles a merge-view together with a column list
			into a single object to be used for the star table construction
	*/

export type ColConfig = {
	"colList": ColList,
	"mv": MergeView | null,
	"stratTotal": number
};

	/* construction / merge operations */

export function newColConfig(colList: ColList): ColConfig {
	return {
		"colList": colList,
		"mv": null,
		"stratTotal": colList.length
	};
}

function excludeNameList(config: ColConfig, nameList: string[]): string[]
{
	var hList = idListColConfig(config);
	return nameList.map((name) => name).filter((name) => hList.includes(name));
}

export function mergeHeaderColConfig(config: ColConfig, h1: string, h2: string)
{
	// initialize merge view
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	// find column 1
	var r1 = findColByHeaderMergeView(mv, h1);
	if (r1 === null) return;
	var [i, mainCol] = r1;
	// find column 2 + merge
	var r2 = findColByHeaderMergeView(mv, h2);
	if (r2 === null) return;
	mergeColByHeaderMergeView(mv, h1, h2);
	// change header
	addNameColByHeaderMergeView(mv, h1, h1, h2);
	config.stratTotal = mv.colList.length;
}

export function mergeListColConfig(config: ColConfig, mainName: string | null, second: boolean | null, nameList: string[])
{
	// exclude filtered columns - if no columns are left / main column is filtered, do not continue
	nameList = excludeNameList(config, nameList);
	if (nameList.length === 0) return;
	if (mainName !== null && !nameList.includes(mainName)) return;
	// initialize merge view
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	// merge columns into main column + collect list of headers used
	if (mainName === null) mainName = nameList[0];
	var secHeaderList: string[] = [];
	for (const name of nameList) {
		var res = findColMergeView(mv, name);
		if (res === null) continue;
		var [i, mCol] = res;
		var mSecond = mCol.partList[0][1].def.diff.includes("second");
		if (second === null || second === mSecond) {
			mergeColMergeView(mv, mainName, name);
			//secHeaderList.push(mCol.header);
			secHeaderList = secHeaderList.concat(mCol.headerList);
		}
	}
	// change header
	var mainHeader = findHeaderMergeView(mv, mainName);
	if (mainHeader !== null) {
		/*var newHeader = mainHeader;
		for (const header of secHeaderList) {
			if (header !== mainHeader) newHeader = newHeader + "/" + header;
		}
		renameColMergeView(mv, mainName, mainName, newHeader);*/
		addNLColMergeView(mv, mainName, mainName, secHeaderList);
	}
	config.stratTotal = mv.colList.length;
}

export function mergeTagsColConfig(config: ColConfig, tag1: string, tag2: string)
{
	// build pairs of columns to combine
	var hList = idListColConfig(config);
	var pairList: [string, string][] = [];
	for (const name of hList) {
		if (name.includes(tag1)) {
			var rName = name.replace(tag1, tag2);
			if (hList.includes(rName)) pairList.push([name, rName]);
		}
	}
	if (hList.includes("Open") && hList.includes("Open#Alt")) pairList.push(["Open", "Open#Alt"]);
	if (pairList.length === 0) return;
	// initialize merge view
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	// merge every pair of columns
	for (const [n1, n2] of pairList) {
		mergeColMergeView(mv, n1, n2);
		var newId = n1.replace(tag1, "").trim();
		var res = findColMergeView(mv, n1);
		if (res === null) throw ("BUG: Attempted to find unknown column " + n1 + ".");
		var [i, mCol] = res;
		var newHeader = mCol.headerList.map((header) => header.replace(tag1, "").trim());
		//addNLColMergeView(mv, n1, newId, newHeader);
		renameListColMergeView(mv, n1, newId, newHeader);
	}
	config.stratTotal = mv.colList.length;
}

export function mergeNamesColConfig(config: ColConfig, specMerge: string[])
{
	// initialize merge view
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	// merge columns
	mergeColMergeView(mv, specMerge[1], specMerge[2]);
	//renameColMergeView(mv, specMerge[1], specMerge[0], specMerge[0])
	renameColMergeView(mv, specMerge[1], specMerge[0], specMerge[0])
	config.stratTotal = mv.colList.length;
}

export function splitVariantPosColConfig(config: ColConfig, idName: string, vName: string, header: string)
{
	// initialize merge view
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	// split columns
	splitColMergeView(mv, idName, vName, idName, header);
	config.stratTotal = mv.colList.length;
}

	/* column specific operations */

export function idColConfig(config: ColConfig, colId: number): string
{
	var mv = config.mv;
	if (mv === null) return config.colList[colId][1].name;
	return mv.colList[colId].id;
}

export function headerColConfig(config: ColConfig, colId: number): string[]
{
	var mv = config.mv;
	if (mv === null) return [config.colList[colId][1].name];
	return mv.colList[colId].headerList;
}
/*
export function renameHeaderColConfig(config: ColConfig, id: string, header: string)
{
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	renameColMergeView(config.mv, id, id, header);
}*/

export function stratListColConfig(config: ColConfig, colId: number): StratDef[]
{
	var mv = config.mv;
	if (mv === null) return [config.colList[colId][1]];
	return mv.colList[colId].partList.map((part) => part[1].def);	
}

export function defStratColConfig(config: ColConfig, colId: number): StratDef
{
	var mv = config.mv;
	if (mv === null) return config.colList[colId][1];
	var partList = mv.colList[colId].partList;
	var strat = partList[0][1].def;
	if (strat.name === "Open" && partList.length > 1) strat = partList[1][1].def;
	return strat;
}

function filterTimeCheck(sDef: StratDef, neg: string[], pos: string[], timeDat: TimeDat): boolean
{
	var vs = sDef.vs;
	// check for bad variants, while collecting the names of variants
	var varList: string[] = [];
	for (const variant of timeDat.rowDef.variant_list) {
		var [vId, groupName] = variant;
		if (vId === -1) continue;
		var vName = vs.variants[vId];
		if (neg.includes(vName)) return false;
		varList.push(vName);
	}
	// check to make sure all necessary variants are included
	for (const p of pos) {
		if (!varList.includes(p)) return false;
	}
	return true;
}

function filterCellCheck(sDef: StratDef, neg: string[], pos: string[], multiDat: TimeDat[]): TimeDat[]
{
	var vs = sDef.vs;
	var newDat: TimeDat[] = [];
	for (const timeDat of multiDat) {
		if (filterTimeCheck(sDef, neg, pos, timeDat)) newDat.push(timeDat);
	}
	return newDat;
}

export function recordColConfig(config: ColConfig, recordMap: RecordMap, colId: number): TimeDat
{
	var mv = config.mv;
	if (mv === null) return recordMap[config.colList[colId][1].name];
	var mCol = mv.colList[colId];
	var recordDat = maxTimeDat(recordMap[mCol.partList[0][1].def.name].rowDef);
	var xFlag = false
	for (let j = 0; j < mCol.partList.length; j++) {
		var strat = mCol.partList[j][1];
		var recName = strat.def.name;
		if (strat.neg.length > 0 || strat.pos.length > 0) {
			recName = strat.header;
			xFlag = true;
		}
		var curDat = recordMap[recName];
		if (curDat !== undefined && curDat.time < recordDat.time) recordDat = curDat;
	}
	return recordDat;
}

	/* multi-column operations */

export function idListColConfig(config: ColConfig): string[]
{
	var mv = config.mv;
	if (mv === null) return config.colList.map((colRef) => colRef[1].name);
	return mv.colList.map((mCol) => mCol.id);
}

export function headerListColConfig(config: ColConfig): string[][]
{
	var mv = config.mv;
	if (mv === null) return config.colList.map((colRef) => [colRef[1].name]);
	return mv.colList.map((mCol) => mCol.headerList);
}

export function recordListColConfig(config: ColConfig, recordMap: RecordMap): TimeDat[]
{
	var timeList: TimeDat[] = [];
	for (let i = 0; i < config.stratTotal; i++) {
		timeList.push(recordColConfig(config, recordMap, i));
	}
	return timeList;
}

export function filterTableColConfig(timeTable: TimeTable, config: ColConfig): TimeTable
{
	var mv = config.mv;
	if (mv === null) return filterTimeTable(timeTable, config.colList);
	var filterTable: TimeTable = [];
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var empty = true;
		var mergeRow = mv.colList.map((mCol) => {
			var mergeCell: MultiDat | null = [];
			for (const [colId, strat] of mCol.partList) {
				var timeCell = userDat.timeRow[colId];
				if (timeCell === null) continue;
				empty = false;
				if (strat.neg.length > 0 || strat.pos.length > 0) {
					var xCell = filterCellCheck(strat.def, strat.neg, strat.pos, timeCell);
					mergeCell = mergeCell.concat(xCell);
				} else {
					mergeCell = mergeCell.concat(timeCell);
				}
			}
			mergeCell.sort(function(a, b) { return a.time - b.time });
			if (mergeCell.length === 0) mergeCell = null;
			return mergeCell;
		});
		if (!empty) filterTable.push({
			"id": userDat.id,
			"timeRow": mergeRow
		});
	}
	return filterTable;
}

	/* primary column configuration */

export function primaryColConfig(cfg: ColConfig, starDef: StarDef, fs: FilterState) {
	// merge open colums w/ designated semi-open columns
	if (fs.altState[0]) mergeListColConfig(cfg, "Open", false, starDef.open);
	if (fs.altState[1]) mergeListColConfig(cfg, "Open#Alt", true, starDef.open);
	// merge alternative columns when required
	if (starDef.alt !== null && fs.altState[0] && fs.altState[1]) {
		if (starDef.alt.status === "mergeOffset") {
			if (starDef.alt.specMerge !== undefined) {
				mergeNamesColConfig(cfg, starDef.alt.specMerge);
			} else {
				mergeTagsColConfig(cfg, "(" + starDef.info.option + ")", "(" + starDef.alt.info.option + ")");
			}
		} else {
			mergeTagsColConfig(cfg, "XXXXXX", "YYYYYY");
		}
	}
}

	/* similar to primary column config, but doesn't merge open columns
		-- this is included here since it uses the same logic */

export function lightColList(colList: ColList, starDef: StarDef, fs: FilterState): ColList {
	// instead of merging alt columns, we simply remove non-special merges
	if (fs.altState[0] && !fs.altState[1]) {
		return filterVarColList(colList, null);
	} else if (fs.altState[1] && !fs.altState[0]){
		return filterVarColList(colList, 1);
	} else if (starDef.alt !== null && fs.altState[0] && fs.altState[1]) {
		if (starDef.alt.status === "mergeOffset" && starDef.alt.specMerge === undefined) return filterVarColList(colList, null);
	}
	return colList;
}