
import { StarLoadFun } from '../api_history'

import { TimeDat, VerOffset, StratOffset } from '../time_dat'
import { TimeTable, filterTimeTable, filterTimeTableEx } from '../time_table'
import { ColList, filterVarColList } from '../org_strat_def'
import { ExtState, FilterState, StarDef, newFilterState, copyFilterState,
	starCode, orgStarDef, verOffsetStarDef, stratOffsetStarDef, colListStarDef } from '../org_star_def'
import { RecordMap, xcamRecordMap } from '../xcam_record_map'

import { AltType, StarRef, StarMap, altListStarRef, addStarMap, newStarMapAlt } from '../star_map'


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
	var rulesKey = fs.extFlag === "rules" ? starCode(stageId, starDef) : null;
	var timeTable = f(stageId, starDef, colList, verOffset, sOffset, rulesKey);
	if (verifFlag) timeTable = filterTimeTableEx(timeTable, (dat) => { return dat.verifFlag === 'yes' || dat.verifFlag === 'maybe' });
	else timeTable = filterTimeTableEx(timeTable, (dat) => { return dat.verifFlag !== 'no' || dat.link === null })
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
	return starMap;
}
