
import { StarLoadFun } from '../api_history'

import { TimeDat, VerOffset, StratOffset } from '../time_dat'
import { TimeTable, filterTimeTable, filterTimeTableEx } from '../time_table'
import { ColList, filterVarColList } from '../org_strat_def'
import { ExtState, FilterState, StarDef, newFilterState, copyFilterState,
	orgStarDef, verOffsetStarDef, stratOffsetStarDef, colListStarDef } from '../org_star_def'
import { RecordMap, xcamRecordMap } from '../xcam_record_map'

import { AltType, StarRef, StarMap, altListStarRef, addStarMap, newStarMapAlt } from '../star_map'

	/*
		star ref: in general, star time data is attached to a star ref identifying
			the original star + whether it refers to a specific alternate or not
		* null - alternate does not exist OR data includes both variants
		* main/alt - information relates to a specific variant
	*/

/*export type StarRef = {
	"stageId": number,
	"starId": string,
	"alt": AltState,
	"100c": boolean
};*/

/*
export function statKey(ref: StarRef): string
{
	var baseKey = ref.stageId + "_" + ref.starId;
	var alt = ref.alt;
	if (alt.state === null || alt.source === "all") return baseKey;
	if (alt.state === "main") return baseKey + "_main";
	return baseKey + "_alt";
}

export function statKeyRaw(stageId: number, starId: string, alt: AltState): string
{
	var baseKey = stageId + "_" + starId;
	if (alt.state === null) return baseKey;
	if (alt.state === "main") return baseKey + "_main";
	return baseKey + "_alt";
}

export function starOnlyKey(ref: StarRef): [string, AltState]
{
	var baseKey = ref.stageId + "_" + ref.starId;
	return [baseKey, ref.alt];
}*/

	/*
		stats star data: structured storage for xcam data (stores all times + records for a star)
	*/

export type StxStarData = StarRef<AltType> & {
	"vs": VerOffset,
	"colList": ColList,
	"recordMap": RecordMap,
	"timeTable": TimeTable
};

function getStxStarData(f: StarLoadFun, stageId: number, starDef: StarDef, colList: ColList, fs: FilterState, verifFlag: boolean): StxStarData
{
	// read raw data
	var verOffset = verOffsetStarDef(starDef, fs);
	var sOffset = stratOffsetStarDef(starDef, fs);
	var timeTable = f(stageId, starDef, colList, verOffset, sOffset);
	if (verifFlag) timeTable = filterTimeTableEx(timeTable, (dat) => { return dat.verifFlag === 'yes' || dat.verifFlag === 'maybe' });
	// transform into filtered data
	var relRM = xcamRecordMap(colList, fs, verOffset, sOffset, 1);
	// has alts
	var secondFlag = false;
	if (starDef.alt !== null) secondFlag = true;
	return {
		"stageId": stageId,
		"starDef": starDef,
		"alt": null, //secondFlag ? "all" : "self"),
			// TODO: replace with actual 100c flag from org_data
		//"100c": starDef.id.includes("100c"),
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
		"starDef": base.starDef,
		"alt": alt === null ? "main" : "alt", //mainAlt() : secondAlt(),
		"vs": base.vs,
		"colList": filterColList,
		"recordMap": base.recordMap,
		"timeTable": filterTimeTable(base.timeTable, filterColList)
	}
}

export function recordStxStarData(starData: StxStarData, alt: AltType): TimeDat
{
	if (alt === "alt") return starData.recordMap["Open#Alt"];
	var recordDat = starData.recordMap["Open"];
	if (alt === "main") return recordDat;
	/*if (alt.source === "self") {
		if (alt.state === null) return recordDat;
		if (alt.state === "main") return recordDat;
		return starData.recordMap["Open#Alt"];
	}*/
	var altDat = starData.recordMap["Open#Alt"];
	if (altDat.time < recordDat.time) return altDat;
	return recordDat;
}

	/*
		stats star map: mapping of "star keys" into star time data. 
	*/

export type StxStarMap = StarMap<AltType, StxStarData>;

//export function getStarTimeMap(f: StarLoadFun, starSet: [StarDef, number][][], extFlag: ExtState, verifFlag: boolean): StxStarMap {
export function getStarTimeMap(f: StarLoadFun, starSet: StarDef[], extFlag: ExtState, verifFlag: boolean): StxStarMap {
	var starMap: StxStarMap = newStarMapAlt();
	// for every star
	for (const starDef of starSet) {
		// setup filter
		var varTotal = 0;
		if (starDef.variants) varTotal = starDef.variants.length;
		var fs = newFilterState([true, true], true, varTotal);
		if (extFlag !== null) fs.extFlag = extFlag;
		fs.verState = [true, true];
		// load raw time data
		var colList = colListStarDef(starDef, fs);
		if (colList.length === 0) continue;
		var timeData = getStxStarData(f, starDef.stageId, starDef, colList, fs, verifFlag);
		// get relevant sub-star refs
		var subRefList = altListStarRef(starDef);
		for (const subRef of subRefList) {
			if (subRef.alt === null) addStarMap(starMap, subRef, timeData);
			else if (subRef.alt === "main") {
				var mainData = filterStxStarData(timeData, colList, null);
				if (mainData !== null) addStarMap(starMap, subRef, mainData);
			} else {
				var altData = filterStxStarData(timeData, colList, 1);
				if (altData !== null) addStarMap(starMap, subRef, altData);
			}
		}
	}
	// for every stage + star
	/*for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var [starDef, starId] = starSet[i][j];
			//var key = i + "_" + starDef.id;
			// no extension data, combine alt strats when applicable
			var varTotal = 0;
			if (starDef.variants) varTotal = starDef.variants.length;
			var fs = newFilterState([true, true], true, varTotal);
			if (extFlag !== null) fs.extFlag = extFlag;
			fs.verState = [true, true];
			// get un-split time data
			var colList = colListStarDef(starDef, fs);
			if (colList.length === 0) continue;
			var timeData = getStxStarData(f, i, starDef, colList, fs, verifFlag);
			// add the "all" comparison for regular stars + offset stars
			if (starDef.alt === null || starDef.alt.status === "offset") addStarMapAlt(starMap, starDef, null, timeData);
			// for any other alternates, add the variant comparison
			if (starDef.alt !== null) {
				var mainData = filterStxStarData(timeData, colList, null);
				var altData = filterStxStarData(timeData, colList, 1);
				addStarMapAlt(starMap, starDef, "main", mainData);
				addStarMapAlt(starMap, starDef, "alt", altData);
				//if (mainData !== null) starMap[key + "_main"] = mainData;
				//if (altData !== null) starMap[key + "_alt"] = altData;
			}
		}
	}*/
	return starMap;
}
