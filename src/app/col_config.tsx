
import { StratDef, ColList } from './org_strat_def'
import { StarDef, FilterState } from './org_star_def'
import { TimeDat, MultiDat } from './time_dat'
import { TimeTable, filterTimeTable } from './time_table'
import { RecordMap } from './xcam_record_map'
import { MergeView, newMergeView, findColMergeView, findHeaderMergeView, mergeColMergeView, renameColMergeView } from './col_merge_view'

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
function filterOpenList(colList: ColList, openList: string[]): string[]
{
	var nameList = colList.map((_strat) => _strat[1].name);
	return openList.filter((name) => nameList.includes(name));
}

function openListMergeView(colList: ColList, openList: string[]): MergeView | null
{
	// exclude columns that dont matter
	openList = filterOpenList(colList, openList);
	// if open list is empty, or the open column has been filtered out, dont merge view
	if (openList.length === 0 || !openList.includes("Open")) return null;
	// otherwise, merge everything from open list into the open column (we assume Open exists by construction)
	var mv = newMergeView(colList);
	mergeColListMergeView(mv, "Open", openList);
	return mv;
}
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

export function mergeListColConfig(config: ColConfig, mainName: string | null, second: boolean, nameList: string[])
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
		var mSecond = mCol.partList[0][1].diff.includes("second");
		if (second === mSecond) {
			mergeColMergeView(mv, mainName, name);
			secHeaderList.push(mCol.header);
		}
	}
	// change header
	var mainHeader = findHeaderMergeView(mv, mainName);
	if (mainHeader !== null) {
		var newHeader = mainHeader;
		for (const header of secHeaderList) {
			if (header !== mainHeader) newHeader = newHeader + "/" + header;
		}
		renameColMergeView(mv, mainName, mainName, newHeader);
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
		var newHeader = mCol.header.replace(tag1, "").trim();
		renameColMergeView(mv, n1, newId, newHeader);
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
	renameColMergeView(mv, specMerge[1], specMerge[0], specMerge[0])
	config.stratTotal = mv.colList.length;
}

	/* column specific operations */

export function idColConfig(config: ColConfig, colId: number): string
{
	var mv = config.mv;
	if (mv === null) return config.colList[colId][1].name;
	return mv.colList[colId].id;
}

export function headerColConfig(config: ColConfig, colId: number): string
{
	var mv = config.mv;
	if (mv === null) return config.colList[colId][1].name;
	return mv.colList[colId].header;
}

export function renameHeaderColConfig(config: ColConfig, id: string, header: string)
{
	if (config.mv === null) config.mv = newMergeView(config.colList);
	var mv = config.mv;
	renameColMergeView(config.mv, id, id, header);
}

export function stratListColConfig(config: ColConfig, colId: number): StratDef[]
{
	var mv = config.mv;
	if (mv === null) return [config.colList[colId][1]];
	return mv.colList[colId].partList.map((part) => part[1]);	
}

export function defStratColConfig(config: ColConfig, colId: number): StratDef
{
	var mv = config.mv;
	if (mv === null) return config.colList[colId][1];
	var partList = mv.colList[colId].partList;
	var strat = partList[0][1];
	if (strat.name === "Open" && partList.length > 1) strat = partList[1][1];
	return strat;
}

export function recordColConfig(config: ColConfig, recordMap: RecordMap, colId: number): TimeDat
{
	var mv = config.mv;
	if (mv === null) return recordMap[config.colList[colId][1].name];
	var mCol = mv.colList[colId];
	var recordDat = recordMap[mCol.partList[0][1].name];
	for (let j = 1; j < mCol.partList.length; j++) {
		var strat = mCol.partList[j][1];
		var curDat = recordMap[strat.name];
		if (curDat.time < recordDat.time) recordDat = curDat;
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

export function headerListColConfig(config: ColConfig): string[]
{
	var mv = config.mv;
	if (mv === null) return config.colList.map((colRef) => colRef[1].name);
	return mv.colList.map((mCol) => mCol.header);
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
				mergeCell = mergeCell.concat(timeCell);
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

/*
export function openListColConfig(colList: ColList, openList: string[]): ColConfig {
	var mv = openListMergeView(colList, openList);
	var stratTotal = colList.length;
	if (mv !== null) stratTotal = mv.list.length;
	return {
		"colList": colList,
		"mv": mv,
		"stratTotal": stratTotal
	};
}

export function firstStratColConfig(config: ColConfig, colId: number): StratDef
{
	var mv = config.mv
	if (mv === null) return config.colList[colId][1];
	var strat = mv.list[colId][0][1];
	console.log("CONFIG PICK");
	console.log(strat);
	// use non-open column when available
	if (strat.name === "Open" && mv.list[colId].length > 1) strat = mv.list[colId][1][1];
	return strat;
}

function hasNameStratList(sl: ColRef[], name: string): boolean
{
	for (const _strat of sl)
	{
		if (_strat[1].name === name) return true;
	}
	return false;
}
export function nameListColConfig(config: ColConfig, colId: number): string[]
{
	var mv = config.mv;
	if (mv === null) return [config.colList[colId][1].name];
	var mainList = mv.list[colId].map((_strat) => _strat[1].name);
	//if (mv.openName !== null && hasNameStratList(mv.list[colId], mv.openName)) mainList.unshift("Open");
	return mainList;
}*/



/*
function nameListStratList(sl: ColRef[], openName: string | null): string
{
	var str = sl[0][1].name;
	for (let i = 1; i < sl.length; i++) {
		str = str + "/" + sl[i][1].name;
	}
	if (openName !== null && hasNameStratList(sl, openName)) {
		str = "Open/" + str;
	}
	return str;
}*/

/*
export function recordListColConfig(config: ColConfig, recordMap: RecordMap): TimeDat[]
{
	var mv = config.mv;
	if (mv === null) return config.colList.map((_strat) => recordMap[_strat[1].name]);
	return mv.list.map((sl, i) => {
		var recordDat = recordMap[sl[0][1].name];
		for (let j = 1; j < sl.length; j++) {
			var curDat = recordMap[sl[j][1].name];
			if (curDat.time < recordDat.time) recordDat = curDat;
		}
		return recordDat;
	});
}

export function filterTableColConfig(timeTable: TimeTable, config: ColConfig): TimeTable
{
	var mv = config.mv;
	if (mv === null) return filterTimeTable(timeTable, config.colList);
	var filterTable: TimeTable = [];
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var empty = true;
		var mergeRow = mv.list.map((sl) => {
			var mergeCell: MultiDat | null = [];
			for (const _strat of sl) {
				var [colId, strat] = _strat;
				var timeCell = userDat.timeRow[colId];
				if (timeCell === null) continue;
				empty = false;
				mergeCell = mergeCell.concat(timeCell);
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
}*/






	/*
		merge_view: an abstract data structure defining sets of column ids
		 that should be viewed as individual columns. this system is used
		 to merge strats without having to actually make "merged strat defs"
		 (which would be more complicated overall).
		* list: an array of lists of [column id, strat def] pairs, each representing a "merged" column.
	*/

	/* merge view creation functions */
/*
type ColRef = [number, StratDef]

type MergeView = {
	"list": ColRef[][]
};

	// would export
function newMergeView(colList: ColList): MergeView
{
	return {
		"list": colList.map((strat) => [strat])
	};
}

function findColMergeView(mv: MergeView, name: string): [number, ColRef] | null
{
	for (let i = 0; i < mv.list.length; i++) {
		var sl = mv.list[i];
		for (let j = 0; j < sl.length; j++) {
			var [colId, strat] = sl[j];
			if (strat.name === name) return [i, sl[j]];
		}
	}
	return null;
}

function removeColMergeView(mv: MergeView, name: string): ColRef
{
	var res = findColMergeView(mv, name);
	if (res === null) throw ("Attempted to remove column with non-existent strat " + name + " from merge view.");
	var [i, _strat] = res;
	mv.list.splice(i, 1);
	return _strat;
}

function addColMergeView(mv: MergeView, name: string, strat: ColRef)
{
	var res = findColMergeView(mv, name);
	if (res === null) throw ("Attempted to add strat " + strat[1].name + " to column with non-existent strat " + name + " from merge view.");
	var [i, _s] = res;
	mv.list[i].push(strat);
}

function mergeColMergeView(mv: MergeView, n1: string, n2: string)
{
	if (n1 === n2) return;
	var _strat = removeColMergeView(mv, n2);
	addColMergeView(mv, n1, _strat);
}

function mergeColListMergeView(mv: MergeView, n: string, nl: string[])
{
	for (let i = 0; i < nl.length; i++) {
		mergeColMergeView(mv, n, nl[i]);
	}
}

function filterOpenList(colList: ColList, openList: string[]): string[]
{
	var nameList = colList.map((_strat) => _strat[1].name);
	return openList.filter((name) => nameList.includes(name));
}

function openListMergeView(colList: ColList, openList: string[]): MergeView | null
{
	// exclude columns that dont matter
	openList = filterOpenList(colList, openList);
	// if open list is empty, or the open column has been filtered out, dont merge view
	if (openList.length === 0 || !openList.includes("Open")) return null;
	// otherwise, merge everything from open list into the open column (we assume Open exists by construction)
	var mv = newMergeView(colList);
	mergeColListMergeView(mv, "Open", openList);
	return mv;
}

	// would export
function formatMergeView(mv: MergeView): string
{
	if (mv === null) return "mv { null }";
	var str = "mv {";
	for (let i = 0; i < mv.list.length; i++)
	{
		if (i !== 0) str = str + ", ";
		var sl = mv.list[i];
		var cx = "[";
		for (let j = 0; j < sl.length; j++) {
			if (j !== 0) cx = cx + ", ";
			cx = cx + sl[j][1].name;
		}
		str = str + cx + "]";
	}
	str = str + "}";
	//if (mv.openName !== null) str = str + ": " + mv.openName;
	return str;
}*/
