import rsData from '../json/rank_struct.json'

import { TimeDat, rawMSFull, msToFrames, framesToMS, applyManualOffset } from "../time_dat"
import { ColList, findIdColList } from "../org_strat_def"
import { StarDef } from "../org_star_def"
import { TimeTable, copyTimeTable, offsetColTimeTable } from "../time_table"
import { ColConfig, newColConfig,
	mergeNamesColConfig, mergeTagsColConfig, mergeListColConfig,
	filterTableColConfig } from "../col_config"
import { RecordMap } from "../xcam_record_map"
//import { ColConfig, idColConfig, headerColConfig, defStratColConfig,
//	stratListColConfig, 
//	recordListColConfig, filterTableColConfig } from '../col_config'

import { RankTimeMap } from "./rank_list"

	/*
		rank_fill_strat: explicit definition of the fill strategy for a given star
	*/

type BenchStrat = { "kind": "benchmark", "strat": string }
type BenchDefStrat = { "kind": "benchmarkDef" }
type ApproxStrat = { "kind": "approx" }
type MultiStrat = { "kind": "multi", "map": {
	[key: string]: RankFillStrat
}}

export type RankFillStrat = BenchStrat | BenchDefStrat | ApproxStrat | MultiStrat

	/*
		force_map: a mapping of strats -> a map of rank times to force
	*/

type ForceMap = {
	[key: string]: RankTimeMap
}

	/*
		rank_fill_rules: describes the DS rules + rank fill strategies
			for a specific star (defines format of the JSON)
	*/

type RankFillRules = {
		// RULES: special requirements that affect daily star scoring
		// -- bans: removes certain strat combinations for scoring purpose
	"ban"?: string[][],
		// phase 1: initial column merges
		// - used to make better time distributions for columns with low fill rates
		// -- cutscene: used to merge cutscene columns which would otherwise not be merged
	"mergeTable"?: string[][],
	"mergeOffset"?: string[][],
	"cutscene"?: string[][],
		// phase 1b/2: approximation / interpolation < NO EXTRA RULES >
		// - fills in missing rank times 
		// -- force: forces specific rank times, used to give a baseline for beginner strats
		// >> for convenience currently happens during phase 1, but could happen later
	"force"?: ForceMap,
		// phase 3: benchmark application
		// - uses REWRITE commands to give ranks to columns with low fill rates + degenerate behavior
		// -- protect: prevents a vanilla column from being benchmarked
		// -- beg/ext: determines strategy for beginner/extension strat columns
		// --- options are to use a benchmark, or to save for approximation phase
		// - descales merged columns
	"benchmark"?: string,
	"protect"?: string[],
	"beg"?: RankFillStrat,
	"ext"?: { [key: string]: RankFillStrat },
		// phase 4: offset / 2nd descale
		// - applies offsets for specific columns (typically for hard strat offsets or beginner columns)
		// - must be applied twice for merged columns
		// - also allows for descaling (changing bronze rank and re-scaling other ranks accordingly)
	"offset"?: string[][],
	"descale"?: string[][]
		// phase 5: versioning < NO EXTRA RULES >
		// - fills out version difference times
}

export const RS_DATA = rsData as { [key: string]: RankFillRules };

	/*
		PHASE 1 (initial colum merge) functions
	*/

export function rulesColConfig(starKey: string, starDef: StarDef, tt: TimeTable, colList: ColList): [ColConfig, TimeTable]
{
	// initialize columns, merge "mergeOffset" columns
	var colConfig = newColConfig(colList);
	if (starDef.alt && starDef.alt.status === "mergeOffset") {
		if (starDef.alt.specMerge !== undefined) {
			mergeNamesColConfig(colConfig, starDef.alt.specMerge);
		} else {
			mergeTagsColConfig(colConfig, "(" + starDef.info.option + ")", "(" + starDef.alt.info.option + ")");
		}
	}
	// check rank struct for merged columns
	if (RS_DATA[starKey]) {
		if (RS_DATA[starKey].cutscene) {
			for (const cc of RS_DATA[starKey].cutscene) {
				mergeNamesColConfig(colConfig, [cc[0], cc[0], cc[1]]);
			}
		}
		if (RS_DATA[starKey].mergeTable) {
			for (const target of RS_DATA[starKey].mergeTable) {
				mergeListColConfig(colConfig, null, null, target);
			}
		}
		if (RS_DATA[starKey].mergeOffset) {
			tt = copyTimeTable(tt);
			for (const mOffset of RS_DATA[starKey].mergeOffset) {
				var [stratName, offset] = mOffset;
				var colId = findIdColList(colList, stratName);
				var ms = rawMSFull(offset);
				if (ms === null) throw ("BUG: rank_fill_rules.tsx - Unreadable offset time '" + offset + "' used for merge offset for " + starKey);
				offsetColTimeTable(tt, colId, msToFrames(ms));
			}
		}
		tt = filterTableColConfig(tt, colConfig);
	}
	return [colConfig, tt];
}

	// defines the list of columns that will need "descaling" later on
	// - full offsetMerges + cutscenes don't need descaling, leaving only the artifical mergeTable elements
export function rulesRescaleList(starKey: string): string[]
{
	var rescaleList: string[] = [];
	if (RS_DATA[starKey] && RS_DATA[starKey].mergeTable) {
		var offList: string[] = [];
		if (RS_DATA[starKey].mergeOffset) {
			offList = RS_DATA[starKey].mergeOffset.map((off) => off[0]);
		}
		for (const target of RS_DATA[starKey].mergeTable) {
			// if any of the targets for a merge rule are in the offset list, do not descale
			var offFlag = false;
			for (const tx of target) {
				if (offList.includes(tx)) offFlag = true;
			}
			if (offFlag) continue;
			// otherwise, add them all to descale list
			for (const tx of target) {
				if (!rescaleList.includes(tx)) rescaleList.push(tx);
			}
		}
	}
	return rescaleList;
}

	/*
		applies special rules for cutscene stars
		- this actually happens prior to the main "rules" function
	*/
export function rulesCutsceneConfig(sKey: string, tt: TimeTable, colList: ColList, rm: RecordMap)
{
	if (!RS_DATA[sKey] || !RS_DATA[sKey].cutscene) return;
	var ccList = RS_DATA[sKey].cutscene;
	for (const cc of ccList) {
		var offset = msToFrames(rm[cc[0]].time) - msToFrames(rm[cc[1]].time);
		var colId = findIdColList(colList, cc[1]);
		offsetColTimeTable(tt, colId, offset);
		applyManualOffset(rm[cc[1]], offset, "manual");
	}
}