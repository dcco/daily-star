import { RS_DATA, rulesColConfig, rulesRescaleList, rulesCutsceneConfig } from "./rank_fill_rules"
import { RANK_NAME_LIST, RANK_NAME_MAP } from './rank_const'

//import { zeroRowDef } from "../row_def"
//import { VerF } from "../variant_def"
//import { TimeDat, rawMSFull, applyManualOffset } from "../time_dat"
//import { TimeRow, TimeTable, copyTimeTable, offsetColTimeTable } from "../time_table"
//import { PlayData } from '../play_data'
//import { StratDef, ColList, findIdColList } from "../org_strat_def"
/*import { StarDef, newFilterState, copyFilterState, mainVerStarDef, hasExtOnlyStarDef,
	colListStarDef, verOffsetStarDef, stratOffsetStarDef } from "../org_star_def"
import { RecordMap, xcamRecordMap } from '../xcam_record_map'*/

import { TimeDat } from '../time_dat'
import { StarDef, newFilterState, hasExtOnlyStarDef,
	colListStarDef, verOffsetStarDef, stratOffsetStarDef } from "../org_star_def"
import { xcamTimeTable } from "../xcam_time_table"
import { xcamRecordMap } from "../xcam_record_map"
import { newColConfig, recordListColConfig } from "../col_config"

//import { StratRankObj, newRankDat, newRankObj, maxRankObj, copyRankObj } from "./rank_obj"
//import { RankMethods, RankList } from "./rank_list"
import { StarRankSet, initStarRankSet, benchmarkStarRankSet, worstListColConfig,
	descaleStarRankSet, cleanStarRankSet, manualDescaleStarRankSet,
	fillBegStarRankSet, fillExtStarRankSet, offsetStarRankSet,
	killFromStarRankSet, fillVerOffsetStratRanks } from "./star_rank_set"

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
	cleanStarRankSet(starKey, ss, extCfg);
	// PHASE 4+5+6: apply offsets + versioning
	manualDescaleStarRankSet(starKey, ss, extRM);
	offsetStarRankSet(starKey, ss);
	killFromStarRankSet(starKey, ss);
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

function parseStrat(note: string): string | null
{
	var tokenList = note.split(/(\s+)/);
	var useFlag = false;
	var parseList = "";
	for (const token of tokenList)
	{
		if (token.trim() === "") {
		} else if (!useFlag && token.startsWith("use:{")) {
			var nt = token.replace("use:{", "").trim();
			if (nt.endsWith("}")) return nt.replace("}", "");
			useFlag = true;
			parseList = nt;
		} else if (useFlag) {
			if (token.endsWith("}")) {
				var nt = token.replace("}", "").trim();
				if (nt === "" || parseList === "") return parseList;
				return parseList + " " + nt;
			} else {
				if (parseList !== "") parseList = parseList + " ";
				parseList = parseList + token.trim();
			}
		}
	}
	if (!useFlag) return null;
	return parseList;
}

export function getRank(srMap: SRMap, rankKey: string, timeDat: TimeDat): string
{
	// lookup strat ranks
	var stratSet = srMap[rankKey];
	var ver = timeDat.rowDef.ver;
	/*var altSet = G_SHEET.srMap[rankKey + "#" + ver];
	if (altSet !== undefined) {
		stratSet = altSet;
		altFlag = true;
	}*/
	var stratName = timeDat.rowDef.name;
	if (stratSet === undefined || stratSet[stratName] === undefined) return "Unranked";
	// notes allow for special names EX `use:{Half Cycle}`
	if (timeDat.note !== null) {
		var noteStrat = parseStrat(timeDat.note);
		if (noteStrat !== null) {
			if (stratSet[noteStrat] !== undefined) stratName = noteStrat;
		}
	}
	var st = stratSet[stratName];
	// iterate through strat ranks
	for (let i = 0; i < RANK_NAME_LIST.length - 1; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		var rankInfo = st.times[rankName];
		if (rankInfo === undefined || rankInfo.sr === "none") continue;
		var rankDat = rankInfo.time;
		// lookup if alt strat should be used
		var altFlag = false;
		var rankTime = rankDat.time;
		if (rankDat.alt !== null && rankDat.alt[1] === ver) rankTime = rankDat.alt[0];
		// if using alt, compare raw time
		//if (altFlag && timeDat.rawTime <= rankTime) return rankName;
		//else if (!altFlag && timeDat.verTime <= rankTime) return rankName;
		if (timeDat.rawTime <= rankTime) return rankName;
	}
	return "Iron";
}

export function getRankValue(r: string): number
{
	var i = RANK_NAME_MAP[r];
	if (i === undefined) return 99;
	return i;
}

export function betterRank(r1: string, r2: string | undefined): string
{
	if (r2 === undefined) return r1;
	var i = RANK_NAME_MAP[r1];
	var j = RANK_NAME_MAP[r2];
	if (i === undefined) return r2;
	else if (j === undefined || i < j) return r1;
	else return r2;
}