import { RANK_NAME_LIST, RANK_NAME_MAP } from "./rank_const"
import { RS_DATA, RankFillStrat } from "./rank_fill_rules"

import { VerF } from "../variant_def"
import { TimeDat, VerOffset, rawMS, rawMSFull, msToFrames, framesToMS } from "../time_dat"
import { TimeTable } from "../time_table"
import { FilterState, StarDef, copyFilterState, mainVerStarDef, verOffsetStarDef } from "../org_star_def"
import { ColConfig, idColConfig, defStratColConfig, headerListColConfig, stratListColConfig } from "../col_config"
import { RecordMap } from "../xcam_record_map"

import { newRankObj } from "./rank_obj"
import { RankMethods, RankList, zeroRankList, genTTRankList,
	interpolateRankList, rewriteRankList, rewriteSelfRankList,
	rescaleRankList, rescaleRankListBack, killFromRankList,
	forceTimesRankList, fillVerOffsetRankList } from "./rank_list"

	/*
		star_rank_set: mapping of strat names -> rank lists for each strat
	*/

export type StarRankSet = {
	[key: string]: RankList
};

	/*
		initializes a list of star ranks based on a column configuration
		-- acomplishes both end of PHASE 1 + PHASE 2
	*/

export function initStarRankSet(starKey: string, tt: TimeTable, colConfig: ColConfig, rm: TimeDat[]): StarRankSet
{
	var ss: StarRankSet = {};
	for (let i = 0; i < colConfig.stratTotal; i++) {
		var idName = idColConfig(colConfig, i);
		var defStrat = defStratColConfig(colConfig, i);
		// if beginner strat
		if (defStrat.virtId !== null) {
			ss[idName] = zeroRankList(idName, "easy");
			// PHASE 1b
			if (RS_DATA[starKey] && RS_DATA[starKey].force) {
				forceTimesRankList(ss[idName], RS_DATA[starKey].force[idName]);
				interpolateRankList(ss[idName], rm[i]);
			}
		} else {
			ss[idName] = genTTRankList(idName, tt, i);
			// PHASE 1b: force overwrite times / interpolate strats
			if (RS_DATA[starKey] && RS_DATA[starKey].force) {
				forceTimesRankList(ss[idName], RS_DATA[starKey].force[idName]);
			}
			interpolateRankList(ss[idName], rm[i]);
		}
	}
	return ss;
}

/*
	var worstList: TimeDat[] = [];
		// collect "worst time" in column (used to rescale merged column times later)
		var stratList = stratListColConfig(colConfig, i);
		if (stratList.length <= 1) {
			worstList.push(rmNew[i]);
		} else {
			var worstTime = rm[stratList[0].name];
			for (let j = 1; j < stratList.length; j++) {
				var recTime = rm[stratList[j].name];
				if (recTime.time > worstTime.time) {
					worstTime = recTime;
				}
			}
			worstList.push(worstTime);
		}
*/

type StratIndex = [number, string];

function findStratIndex(cfg: ColConfig, stratName: string): StratIndex | null
{
	// since this function receives un-merged configs
	//  we don't bother searching the whole header list.
	//  rank_struct.json must simply have the correct name
	for (let i = 0; i < cfg.stratTotal; i++) {
		var idName = idColConfig(cfg, i);
		if (idName === stratName) return [i, stratName];
	}
	return null;
}

	// obtains a star's default benchmark

function defBenchmark(starKey: string, cfg: ColConfig): StratIndex | null
{
	if (RS_DATA[starKey] && RS_DATA[starKey].benchmark) {
		var benchName = RS_DATA[starKey].benchmark;
		for (let i = 0; i < cfg.stratTotal; i++) {
			if (idColConfig(cfg, i) === benchName) return [i, benchName];
		}
		return [-1, benchName];
	}
	return null;
}

	// applies a benchmark strat to another strat

function applyBenchmark(starKey: string, ss: StarRankSet,
	strat: StratIndex, benchmark: StratIndex, mm: RankMethods, cfg: ColConfig, rm: TimeDat[])
{
	// initializes strat if un-initialized
	var [colId, stratName] = strat;
	var target = ss[stratName];
	if (target === undefined) {
		target = zeroRankList(stratName, "normal");
	}
	// apply to benchmark
	var [benchId, benchName] = benchmark;
	if (ss[benchName] === undefined) {
		throw("BUG: star_rank_set.tsx - Could not find source times for benchmark strat " + benchName);
	}
	ss[stratName] = rewriteRankList(ss[benchName], target, rm[benchId], rm[colId], "rewrite");
	ss[stratName].rankMethod = mm;
}

	// applies a general fill strat

export function applyFillStrat(starKey: string, ss: StarRankSet,
	strat: StratIndex, rfs: RankFillStrat, mm: RankMethods, cfg: ColConfig, rm: TimeDat[])
{
	if (rfs.kind === "benchmarkDef") {
		var benchmark = defBenchmark(starKey, cfg);
		if (benchmark === null) throw("BUG: star_rank_set.tsx - No default benchmark defined for " + starKey);
		applyBenchmark(starKey, ss, strat, benchmark, mm, cfg, rm);
		/*var [benchId, benchNameN] = benchmark;
		if (benchNameN === null) throw("BUG: star_rank_set.tsx - No default benchmark defined for " + starKey);
		ss[stratName] = rewriteStratRanks(ss[benchNameN], target, rm[benchId], rm[colId], "rewrite");
		ss[stratName].rankMethod = "easy";*/
	} else if (rfs.kind === "benchmark") {
		var benchmark = findStratIndex(cfg, rfs.strat);
		if (benchmark === null) throw("BUG: star_rank_set.tsx - Could not find benchmark column: " + rfs.strat + " for " + starKey);
		applyBenchmark(starKey, ss, strat, benchmark, mm, cfg, rm)
		/*var benchId = -1;
		var benchName = rfs.strat;
		for (let i = 0; i < cfg.stratTotal; i++) {
			if (idColConfig(cfg, i) === benchName) benchId = i;
		}*/
		//if (benchId === -1) throw("BUG: star_rank_set.tsx - Could not find benchmark column: " + benchName + " for " + starKey);
		//ss[stratName] = rewriteStratRanks(ss[benchName], target, rm[benchId], rmNew[colId], "rewrite");
		//ss[stratName].rankMethod = "easy";
	// does nothing, presumes that you have forced ranks for rank interpolation
	} else if (rfs.kind === "approx") {
		var [colId, stratName] = strat;
		if (ss[stratName]) return;
		if (!RS_DATA[starKey] || !RS_DATA[starKey].force) {
			throw("BUG: star_rank_set.tsx - No baseline times to determine approximate ranks for: " + stratName + " on " + starKey);
		}
		// force overwrite times / interpolate strats
		ss[stratName] = zeroRankList(stratName, mm);
		forceTimesRankList(ss[stratName], RS_DATA[starKey].force[stratName]);
		interpolateRankList(ss[stratName], rm[colId]);
	}
	// if multiple strats enabled, recurse
	else if (rfs.kind === "multi") {
		var [colId, stratName] = strat;
		if (rfs.map[stratName]) {
			var rfsX = rfs.map[stratName];
			applyFillStrat(starKey, ss, strat, rfsX, mm, cfg, rm);
		}
	}
}

	/*
		applies benchmark rules / PHASE 3
	*/

export function benchmarkStarRankSet(starKey: string, ss: StarRankSet, colConfig: ColConfig, rm: TimeDat[])
{
	// check for benchmark column if present
	const benchmark = defBenchmark(starKey, colConfig);
	if (benchmark === null) return;
	const [benchId, benchName] = benchmark;
	if (benchId === -1) throw("BUG: star_rank_set.tsx - Could not find benchmark column: " + benchName + " for " + starKey);
	// rewrite so-called "benchmark" columns
	// collect columns not to benchmark (protected columns + pre-merged columns)
	var badList: string[] = [];
	if (RS_DATA[starKey].protect) badList = RS_DATA[starKey].protect;
	if (RS_DATA[starKey].mergeTable) {
		for (const target of RS_DATA[starKey].mergeTable) {
			badList = badList.concat(target);
		}
	}
	// collect list of eligible columns to benchmark (not self + not protected + not virtual)
	var exList: [string, number][] = [];
	for (let i = 0; i < colConfig.stratTotal; i++) {
		var idName = idColConfig(colConfig, i);
		var defStrat = defStratColConfig(colConfig, i);
		if (idName !== benchName && !badList.includes(idName) && defStrat.virtId === null) {
			exList.push([idName, i]);
		}
	}
	// mark all the benchmarked columns (unless they have high confidence)
	for (const [ex, colId] of exList) {
		if (ss[ex] && ss[ex].confidence < 4) {
			var r1 = rm[benchId];
			var r2 = rm[colId];
			ss[ex] = rewriteRankList(ss[benchName], ss[ex], r1, r2, "rewrite");
		}
	}
}

	// applies beginner fill strategies

export function fillBegStarRankSet(starKey: string, ss: StarRankSet, colConfig: ColConfig, rm: TimeDat[])
{
	// collect list of virtual (beginner) strategies
	var virtList: [number, string][] = [];
	for (let i = 0; i < colConfig.stratTotal; i++) {
		var idName = idColConfig(colConfig, i);
		var defStrat = defStratColConfig(colConfig, i);
		if (defStrat.virtId !== null) {
			if (idName !== "Open" && idName !== "Open#Alt") virtList.push([i, idName]);
		}
	}
	// apply benchmark strats
	if (RS_DATA[starKey] && virtList.length > 0) {
		if (RS_DATA[starKey].beg === undefined) {
			console.log(virtList);
			throw("BUG: star_rank_set.tsx - No beginner strategy defined for " + starKey);
		}
		var rfs = RS_DATA[starKey].beg;
		for (let i = 0; i < virtList.length; i++) {
			applyFillStrat(starKey, ss, virtList[i], rfs, "easy", colConfig, rm);
		}
	}
}

	// applies extensions fill strategies

export function fillExtStarRankSet(starKey: string, ss: StarRankSet, colConfig: ColConfig, rm: TimeDat[])
{
	if (!RS_DATA[starKey] || !RS_DATA[starKey].ext) throw("star_rank_set.tsx - Expected extension strat strategies for " + starKey);
	var extMap = RS_DATA[starKey].ext;
		// prepare columns/records
		//var colConfig = newColConfig(colList);
		//var rmNew = recordListColConfig(colConfig, rm);
		// find "benchmark" columns
		/*var benchId = -1;
		var benchName: string | null = null;
		if (RS_DATA[starKey] && RS_DATA[starKey].benchmark) {
			benchName = RS_DATA[starKey].benchmark;
			for (let i = 0; i < colList.length; i++) {
				if (colList[i][1].name === benchName) benchId = i;
			}
		}*/
	// apply extension fill strategies when they exist
	for (let i = 0; i < colConfig.stratTotal; i++) {
		var stratName = idColConfig(colConfig, i);
		if (extMap[stratName]) {
			var rfs = extMap[stratName];
			applyFillStrat(starKey, ss, [i, stratName], rfs, "hard", colConfig, rm);
		}
	}
	/*for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		if (extMap[stratDef.name]) {
			var rfs = extMap[stratDef.name];
			applyFillStrat(starKey, ss, [colId, stratDef.name], rfs, colConfig, rm);
		}
	}*/
}

	/*
		collect worst record time in a column
		- de-scaling requires us to know the diff between the best and worst time in the merged column
	*/

export function worstListColConfig(colConfig: ColConfig, rm: RecordMap): TimeDat[]
{
	var worstList: TimeDat[] = [];
	for (let i = 0; i < colConfig.stratTotal; i++) {
		// collect "worst time" in column (used to rescale merged column times later)
		var stratList = stratListColConfig(colConfig, i);
		var worstTime = rm[stratList[0].name];
		for (let j = 1; j < stratList.length; j++) {
			var recTime = rm[stratList[j].name];
			if (recTime.time > worstTime.time) {
				worstTime = recTime;
			}
		}
		worstList.push(worstTime);
	}
	return worstList;
}

	/*
		de-scales rank times (requires original set of records)
		- returns the descaled times + which columns were descaled (for exclusion in the future)
	*/

export function descaleStarRankSet(ss: StarRankSet, colConfig: ColConfig, rmOld: RecordMap,
	rm: TimeDat[], wm: TimeDat[], rescaleList: string[] | null, exclList?: string[]): [StarRankSet, string[]]
{
	var ssNew: StarRankSet = {};
	var descaleList: string[] = [];
	for (let i = 0; i < colConfig.stratTotal; i++) {
		var idName = idColConfig(colConfig, i);
		var stratList = stratListColConfig(colConfig, i);
		descaleList.push(idName);
		// ignore columns in exclusion list
		if (exclList && exclList.includes(idName)) {
			ssNew[idName] = ss[idName];
			continue;
		}
		// if a column is un-merged, we can still rewrite based on itself to fix version offsets
		if (stratList.length === 1) {
			if (rm[i].time !== rm[i].verTime) {
				// may activate for open strats
				if (ss[idName] !== undefined) rewriteSelfRankList(ss[idName], rm[i]);
			}
			ssNew[idName] = ss[idName];
			continue;
		}
		// ignore un-merged columns + 
		// rescale main strat
		if (ss[idName] === undefined) {
			if (idName === "Open") continue;
			console.log("Star ranks: ", ss);
			throw("BUG: star_rank_set.tsx - Could not find source times to descale column " + idName);
		}
		// -- if rescale list is provided, check that
		if (rescaleList === null || rescaleList.includes(idName)) rescaleRankList(ss[idName], rm[i], wm[i]);
		// use rescaled time to adjust other times
		for (const strat of stratList) {
			ssNew[strat.name] = rewriteRankList(ss[idName], zeroRankList(strat.name, "rewrite"), rm[i], rmOld[strat.name], "rescale");
		}
	}
	// copies over strats not in column config (ex: if extension strats have been added, but we arent descaling them yet)
	for (const entry of Object.entries(ss)) {
		var [stratName, rl] = entry;
		if (ssNew[stratName] === undefined) ssNew[stratName] = rl; 
	}
	return [ssNew, descaleList];
}

export function cleanStarRankSet(starKey: string, ss: StarRankSet, colConfig: ColConfig)
{
	// get a list of all valid strat names
	var headerSet: { [key: string]: number } = {};
	for (let i = 0; i < colConfig.stratTotal; i++) {
		var stratList = stratListColConfig(colConfig, i);
		for (const strat of stratList) {
			headerSet[strat.name] = 1;
		}
	}
	// remove all entries not found from column config
	for (const entry of Object.entries(ss)) {
		var [stratName, rl] = entry;
		if (headerSet[stratName] === undefined) delete ss[stratName];
	}
	// special case to delete open columns
	var no_open = RS_DATA[starKey] && RS_DATA[starKey].no_open;
	if (no_open) {
		delete ss["Open"];
		delete ss["Open#Alt"];
	}
}

export function manualDescaleStarRankSet(starKey: string, ss: StarRankSet, rm: RecordMap)
{
	if (!RS_DATA[starKey] || !RS_DATA[starKey].descale) return;
	for (const dsc of RS_DATA[starKey].descale) {
		var tarTime = rawMS(dsc[1]);
		if (tarTime === null) throw("BUG: star_rank_set.tsx - Invalid manual descale time given for " + starKey);
		var baseRank: string | null = null;
		if (dsc.length > 2) baseRank = dsc[2];
		rescaleRankListBack(ss[dsc[0]], rm[dsc[0]], tarTime, baseRank);
	}
}

	/*
		applies offsets / PHASE 4
	*/

export function offsetStarRankSet(starKey: string, ss: StarRankSet)
{
	if (RS_DATA[starKey] && RS_DATA[starKey].offset) {
		var offList = RS_DATA[starKey].offset;
		for (let i = 0; i < offList.length; i++) {
			var offsetInfo = offList[i];
			var rankId = RANK_NAME_MAP[offsetInfo[1]];
			var st = ss[offsetInfo[0]];
			if (st === undefined) {
				console.log(ss, offsetInfo);
				throw("BUG: star_rank_set.tsx - Invalid offset target " + offsetInfo[0] + " for " + starKey);
			}
			for (let j = rankId; j < RANK_NAME_LIST.length - 1; j++) {
				var rankName = RANK_NAME_LIST[j][0];
				var stObj = st.times[rankName];
				if (stObj.sr === "none") {
					console.log(rankName, st);
					throw("BUG: star_rank_set.tsx - No rank time " + rankName + " for " + starKey);
				}
				var msN = rawMSFull(offsetInfo[2]);
				if (msN === null) throw("BUG: star_rank_set.tsx - Invalid offset time given for " + starKey);
				var newTime = framesToMS(msToFrames(stObj.time.time) + msToFrames(msN));
				//st.times[rankName] = { "sr": "force", "time": adjustTimeDat(newTime, stObj.time) };
				st.times[rankName] = newRankObj(newTime, { "m": "force" });
			}
		}
	}
}

	/*
		removes ranks for certain strats / PHASE 5
	*/

export function killFromStarRankSet(starKey: string, ss: StarRankSet)
{
	if (RS_DATA[starKey] === undefined || RS_DATA[starKey].kill === undefined) return;
	var killList = RS_DATA[starKey].kill;
	for (const [stratName, rankName] of killList) {
		var rankList = ss[stratName]; 
		if (rankList === undefined) throw("BUG: star_rank_set.tsx - Attempted to remove ranks for unknown strat " + stratName + " for " + starKey);
		killFromRankList(rankList, rankName);
	}
}

	/*
		fills in version offsets / PHASE 6
	*/

function _fillVerOffsetStratRanks(starDef: StarDef, source: StarRankSet, vs: VerOffset)
{
	for (const entry of Object.entries(source)) {
		var [stratName, st] = entry;
		// temporary, will probably throw error eventually
		if (st === undefined) continue;
		var stratDef = starDef.jp_set[stratName];
		if (stratDef === undefined) stratDef = starDef.us_set[stratName];
		if (stratDef === undefined) {
			throw("BUG: star_rank_set.tsx - Checking version status for non-existent strat " + stratName + " for star " + starDef.name);
		}
		// check if version diff actually matters
		if (stratDef.vs.verInfo !== null || (stratDef.virtId !== null && stratDef.virtId.ver_diff)) {
			fillVerOffsetRankList(st, stratName, vs);
		}
	}
}

export function fillVerOffsetStratRanks(starDef: StarDef, ss: StarRankSet, fs: FilterState, vs: VerOffset)
{
	if (starDef.offset.a || starDef.offset.num !== 0) {
		var altVer: VerF = "us";
		// right now only applicable to ccm 100 + slide & wdw 100 + secrets
		if (mainVerStarDef(starDef) === "us") altVer = "jp";
		// get offset for alternate time
		var altFS = copyFilterState(fs);
		if (altVer === "us") altFS.verState = [false, true];
		else altFS.verState = [true, false];
		var altOffset = verOffsetStarDef(starDef, altFS);
		// regenerate strat ranks based on new version offset
		_fillVerOffsetStratRanks(starDef, ss, altOffset);
	}
}