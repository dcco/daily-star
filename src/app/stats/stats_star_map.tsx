
import { TimeDat, VerOffset, StratOffset } from '../time_dat'
import { TimeTable, filterTimeTable } from '../time_table'
import { ColList, filterVarColList } from '../org_strat_def'
import { FilterState, StarDef, newFilterState, copyFilterState,
	orgStarDef, verOffsetStarDef, stratOffsetStarDef, colListStarDef } from '../org_star_def'
import { RecordMap, xcamRecordMap } from '../xcam_record_map'
import { xcamTimeTable } from '../xcam_time_table'

	/*
		alt state: represents both what variant of a star is being used
			and what variants it was compared against.
		* state - whether the data represents the alt or the main (null = no alternates originally)
		* source - the original comparison this alt comes from
	*/

export type AltState = {
	"state": null | "main" | "alt",
	"source": "all" | "self"
}

export function nullAlt(source: "all" | "self"): AltState {
	return { "state": null, "source": source }
}

export function mainAlt(): AltState {
	return { "state": "main", "source": "self" }
}

export function secondAlt(): AltState {
	return { "state": "alt", "source": "self" }
}

	/*
		star ref: in general, star time data is attached to a star ref identifying
			the original star + whether it refers to a specific alternate or not
		* null - alternate does not exist OR data includes both variants
		* main/alt - information relates to a specific variant
	*/

export type StarRef = {
	"stageId": number,
	"starId": string,
	"alt": AltState
};

export function statKey(ref: StarRef): string
{
	var baseKey = ref.stageId + "_" + ref.starId;
	var alt = ref.alt;
	if (alt.state === null || alt.source === "all") return baseKey;
	if (alt.state === "main") return baseKey + "_main";
	return baseKey + "_alt";
}

	/*
		stats star data: structured storage for xcam data (stores all times + records for a star)
	*/

export type StxStarData = StarRef & {
	"vs": VerOffset,
	"colList": ColList,
	"recordMap": RecordMap,
	"timeTable": TimeTable
};

function getStxStarData(stageId: number, starDef: StarDef, colList: ColList, fs: FilterState): StxStarData
{
	// read raw data
	var verOffset = verOffsetStarDef(starDef, fs);
	var sOffset = stratOffsetStarDef(starDef, fs);
	var timeTable = xcamTimeTable(colList, verOffset, sOffset, 1);
	// transform into filtered data
	var relRM = xcamRecordMap(colList, fs, verOffset, sOffset, 1);
	// has alts
	var secondFlag = false;
	if (starDef.alt !== null) secondFlag = true;
	return {
		"stageId": stageId,
		"starId": starDef.id,
		"alt": nullAlt(secondFlag ? "all" : "self"),
		"vs": verOffset,
		"colList": colList,
		"recordMap": relRM,
		"timeTable": timeTable
	};
}

export function filterStxStarData(base: StxStarData, colList: ColList, alt: number | null): StxStarData | null
{
	var filterColList = filterVarColList(colList, alt);
	if (filterColList.length === 0) return null;
	return {
		"stageId": base.stageId,
		"starId": base.starId,
		"alt": alt === null ? mainAlt() : secondAlt(),
		"vs": base.vs,
		"colList": filterColList,
		"recordMap": base.recordMap,
		"timeTable": filterTimeTable(base.timeTable, filterColList)
	}
}

export function recordStxStarData(starData: StxStarData, alt: AltState): TimeDat
{
	var recordDat = starData.recordMap["Open"];
	if (alt.source === "self") {
		if (alt.state === null) return recordDat;
		if (alt.state === "main") return recordDat;
		return starData.recordMap["Open#Alt"];
	}
	var altDat = starData.recordMap["Open#Alt"];
	if (altDat.time < recordDat.time) return altDat;
	return recordDat;
}

	/*
		stats star map: mapping of "star keys" into star time data. 
	*/

export type StxStarMap = {
	[key: string]: StxStarData
};

export function getStarTimeMap(starSet: [StarDef, number][][]): StxStarMap {
	var starMap: StxStarMap = {};
	// for every stage + star
	for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var [starDef, starId] = starSet[i][j];
			var key = i + "_" + starDef.id;
			// no extension data, combine alt strats when applicable
			var fs = newFilterState([true, true], false);
			fs.verState = [true, true];
			// get un-split time data
			var colList = colListStarDef(starDef, fs);
			if (colList.length === 0) continue;
			var timeData = getStxStarData(i, starDef, colList, fs);
			// add the "all" comparison for regular stars + offset stars
			if (starDef.alt === null || starDef.alt.status === "offset") starMap[key] = timeData;
			// for any other alternates, add the variant comparison
			if (starDef.alt !== null) {
				var mainData = filterStxStarData(timeData, colList, null);
				var altData = filterStxStarData(timeData, colList, 1);
				if (mainData !== null) starMap[key + "_main"] = mainData;
				if (altData !== null) starMap[key + "_alt"] = altData;
			}
			// if normal / normal offset star, do not modify time data
			/*if (starDef.alt === null || starDef.alt.status === "offset") {
				starMap[key] = timeData;
				// if offset applicable, we calculate the filter data anyway
				if (starDef.alt !== null) {
					var mainData = filterStxStarData(timeData, colList, null);
					var altData = filterStxStarData(timeData, colList, 1);
					if (mainData !== null) starMap[key + "_off1"] = mainData;
					if (altData !== null) starMap[key + "_off2"] = altData;
				}
			} else {
				// otherwise, split into variant information
				var mainData = filterStxStarData(timeData, colList, null);
				var altData = filterStxStarData(timeData, colList, 1);
				if (mainData !== null) starMap[key] = mainData;
				if (altData !== null) starMap[key + "_alt"] = altData;
			}*/
		}
	}
	return starMap;
}
