import { RS_DATA, rulesColConfig, rulesRescaleList, rulesCutsceneConfig } from "./rank_fill_rules"

//import { zeroRowDef } from "../row_def"
//import { VerF } from "../variant_def"
//import { TimeDat, rawMSFull, applyManualOffset } from "../time_dat"
//import { TimeRow, TimeTable, copyTimeTable, offsetColTimeTable } from "../time_table"
//import { PlayData } from '../play_data'
//import { StratDef, ColList, findIdColList } from "../org_strat_def"
/*import { StarDef, newFilterState, copyFilterState, mainVerStarDef, hasExtOnlyStarDef,
	colListStarDef, verOffsetStarDef, stratOffsetStarDef } from "../org_star_def"
import { RecordMap, xcamRecordMap } from '../xcam_record_map'*/

import { StarDef, newFilterState, hasExtOnlyStarDef,
	colListStarDef, verOffsetStarDef, stratOffsetStarDef } from "../org_star_def"
import { xcamTimeTable } from "../xcam_time_table"
import { xcamRecordMap } from "../xcam_record_map"
import { newColConfig, recordListColConfig } from "../col_config"

//import { StratRankObj, newRankDat, newRankObj, maxRankObj, copyRankObj } from "./rank_obj"
//import { RankMethods, RankList } from "./rank_list"
import { StarRankSet, initStarRankSet, benchmarkStarRankSet, worstListColConfig,
	descaleStarRankSet, cleanStarRankSet, manualDescaleStarRankSet,
	fillBegStarRankSet, fillExtStarRankSet, offsetStarRankSet, fillVerOffsetStratRanks } from "./star_rank_set"

	/*
		TODO - de-duplicate
	*/

export const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function getStarKey(stageId: number, starDef: StarDef): string
{
	return PERM[stageId] + "_" + starDef.id;
}

	/*
		star_rank_map: a mapping of star keys -> star strat rankings
	*/

export type SRMap = {
	[key: string]: StarRankSet
}

/*
export function extendStratRanks(ss: StratTimeSet, starDef: StarDef, starKey: string, colList: ColList, tt: TimeTable, rm: RecordMap)
{
	// apply extension strat interpolation strategies
	if (RS_DATA[starKey] && RS_DATA[starKey].ext) {
		var extMap = RS_DATA[starKey].ext;
		// prepare columns/records
		var colConfig = newColConfig(colList);
		var rmNew = recordListColConfig(colConfig, rm);
		// find "benchmark" columns
		var benchId = -1;
		var benchName: string | null = null;
		if (RS_DATA[starKey] && RS_DATA[starKey].benchmark) {
			benchName = RS_DATA[starKey].benchmark;
			for (let i = 0; i < colList.length; i++) {
				if (colList[i][1].name === benchName) benchId = i;
			}
		}
		// apply fill strats when they exist
		for (let i = 0; i < colList.length; i++) {
			var [colId, stratDef] = colList[i];
			if (extMap[stratDef.name]) {
				var rfs = extMap[stratDef.name];
				applyFillStrat(starKey, ss, rfs, colConfig, rmNew, [colId, stratDef.name], [benchId, benchName]);
			}
		}
	} else {
		throw("strat_ranks.tsx - Expected extension strat strategies for " + starKey);
	}
}*/

function genStarRankSetFull(starDef: StarDef, starKey: string): StarRankSet
{
	// build filter state (no extension data by default)
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var fs = newFilterState([true, true], true, varTotal);
	fs.verState = [true, true];
	// do extensions on the first pass if we need "No Cutscene" star versions
	var extFirstPass = starDef.alt && starDef.alt.status === "cutscene";
	if (extFirstPass) fs.extFlag = true;
	// collect time data
	const colList = colListStarDef(starDef, fs);
	const verOffset = verOffsetStarDef(starDef, fs);
	const sOffset = stratOffsetStarDef(starDef, fs);
	var tt = xcamTimeTable(colList, verOffset, sOffset);
	var rm = xcamRecordMap(colList, fs, verOffset, sOffset);
	// PHASE 1: generate time table from rules
	rulesCutsceneConfig(starKey, tt, colList, rm);
	var rescaleList = rulesRescaleList(starKey);
	var [cfg, ttNew] = rulesColConfig(starKey, starDef, tt, colList);
	var rmNew = recordListColConfig(cfg, rm);
	// PHASE 1+2: generate strat ranks w/ interpolation
	var ss = initStarRankSet(starKey, ttNew, cfg, rmNew);
	// PHASE 3: apply benchmarks, descale, apply beg/ext rules
	benchmarkStarRankSet(starKey, ss, cfg, rmNew);
	fillBegStarRankSet(starKey, ss, cfg, rmNew);
	// collect alternate time data for extension rules
	var extCfg = cfg;
	var extRM = rm;
	var extRL = rmNew;
	if (hasExtOnlyStarDef(starDef)) {
		fs.extFlag = true;
		var extColList = colListStarDef(starDef, fs);
		//var extTT = xcamTimeTable(extColList, verOffset, sOffset);
		var extRM = xcamRecordMap(extColList, fs, verOffset, sOffset);
		var [_extCfg, _unusedTT] = rulesColConfig(starKey, starDef, tt, extColList);
		extCfg = _extCfg;
		//var extCfg = newColConfig(extColList);
		extRL = recordListColConfig(extCfg, extRM);
		fillExtStarRankSet(starKey, ss, extCfg, extRL);
	}
	// -- descaling, w/ separate descaling for "extension records"
	var wm = worstListColConfig(cfg, rm);
	var [_ss, descaleList] = descaleStarRankSet(ss, cfg, rm, rmNew, wm, rescaleList);
	ss = _ss;
	if (hasExtOnlyStarDef(starDef)) {
		var extWM = worstListColConfig(extCfg, extRM);
		// -- ignore previously "de-scaled" columns
		var [_extSS, _unusedDL] = descaleStarRankSet(ss, extCfg, extRM, extRL, extWM, rescaleList, descaleList);
		ss = _extSS;
	}
	cleanStarRankSet(ss, extCfg);
	// PHASE 4+5: apply offsets + versioning
	manualDescaleStarRankSet(starKey, ss, extRM);
	offsetStarRankSet(starKey, ss);
	fillVerOffsetStratRanks(starDef, ss, fs, verOffset);
	return ss;
}

export function genStarRankMap(starSet: [StarDef, number][][]): SRMap
{
	var srMap: SRMap = {};
	// for every stage + star
	for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			var [starDef, starId] = starSet[i][j];
			var starKey = getStarKey(i, starDef);
			// simpler key for convenience
			srMap[i + "_" + starDef.id] = genStarRankSetFull(starDef, starKey);
		}
	}
	return srMap;
}

/*
export function genStarRankMap(starSet: [StarDef, number][][]): SRMap
{
	var srMap: SRMap = {};
	// for every stage + star
	for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build star key
			var [starDef, starId] = starSet[i][j];
			var key = i + "_" + starDef.id;
			// no extension data, combine alt strats when applicable
			var varTotal = 0;
			if (starDef.variants) varTotal = starDef.variants.length;
			var fs = newFilterState([true, true], true, varTotal);
			// do extensions on the first pass if we need no cutscene star versions
			var extFirstPass = starDef.alt && starDef.alt.status === "cutscene";
			if (extFirstPass) fs.extFlag = true;
			fs.verState = [true, true];
			// collect time data
			var colList = colListStarDef(starDef, fs);
			var verOffset = verOffsetStarDef(starDef, fs);
			var sOffset = stratOffsetStarDef(starDef, fs);
			var tt = xcamTimeTable(colList, verOffset, sOffset);
			var rm = xcamRecordMap(colList, fs, verOffset, sOffset);
			// if cutscene merge, we can apply cutscene offset
			var sKey = PERM[i] + "_" + starDef.id;
			if (RS_DATA[sKey]) {
				var starData = RS_DATA[sKey];
				if (starData.cutscene) {
					var ccList = starData.cutscene;
					for (const cc of ccList) {
						var offset = msToFrames(rm[cc[0]].time) - msToFrames(rm[cc[1]].time);
						var colId = findIdColList(colList, cc[1]);
						offsetColTimeTable(tt, colId, offset);
						applyManualOffset(rm[cc[1]], offset, "manual");
					}
				}
			}
			// generate strat ranks
			var ss = genStratRanks(starDef, sKey, colList, tt, rm);
			srMap[key] = ss;
			// move onto extension strats (use more filled out time table)
			if (!extFirstPass && RS_DATA[sKey] && hasExtOnlyStarDef(starDef)) {
				fs.extFlag = true;
				var extColList = colListStarDef(starDef, fs);
				var extTT = xcamTimeTable(extColList, verOffset, sOffset);
				var extRM = xcamRecordMap(extColList, fs, verOffset, sOffset);
				extendStratRanks(ss, starDef, sKey, extColList, extTT, extRM);
			}
			// add US/JP strat rank when relevant
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
				applyVerOffsetStratRanks(starDef, ss, altOffset);
			}
		}
	}
	return srMap;
}*/