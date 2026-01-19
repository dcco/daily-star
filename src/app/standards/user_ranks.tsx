import { G_SHEET } from '../api_xcam'

import { StarLoadFun } from '../api_history'
import { TimeDat } from '../time_dat'
import { keyIdent } from '../time_table'
import { StarDef, ExtState, newFilterState, colListStarDef,
	verOffsetStarDef, stratOffsetStarDef } from '../org_star_def'
import { AltType, StarRef, StarMap, starCodeW, lookupStarMap, addStarMap, 
	newStarMapAlt, canCombStarRef, tryCombStarMap, toListStarMap } from '../star_map'

import { StxStarData, StxStarMap } from '../stats/stats_star_map'
import { getRank, betterRank } from './strat_ranks'

/*export type BestRankData = {
	mainRank: string,
	altRank?: string,
	combRank?: string
};*/

export type UserStarRankMap = StarMap<AltType, string>;

export type UserRankMap = {
	[key: string]: UserStarRankMap
};

function addStarUserRankMap(starRef: StarRef<AltType>, starData: StxStarData,
	rankMap: UserRankMap, virtFlag: boolean, extFlag: ExtState)
{
	const timeTable = starData.timeTable;
	// iterate through time table
	for (const userDat of timeTable)
	{
		// lookup user's rank map
		var userKey = keyIdent(userDat.id);
		if (rankMap[userKey] === undefined) rankMap[userKey] = newStarMapAlt();
		var userRankMap = rankMap[userKey];
		// lookup star in rank map
		var curRank = lookupStarMap(userRankMap, starRef);
		// go through time row
		for (let i = 0; i < userDat.timeRow.length; i++) {
			const multiDat = userDat.timeRow[i];
			if (multiDat === null) continue;
			for (const timeDat of multiDat) {
				var rank = getRank(G_SHEET.srMap, starCodeW(starRef.starDef), timeDat);
				if (curRank === null || betterRank(rank, curRank)) curRank = rank;
			}
		}
		if (curRank === null) curRank = "Unranked";
		addStarMap(userRankMap, starRef, curRank);
	}
}

function takeBetterRank(r1: string, r2: string): string
{
	if (betterRank(r1, r2)) return r1;
	return r2;
}

export function calcUserRankMap(starMap: StxStarMap, virtFlag: boolean, extFlag: ExtState): UserRankMap
{
	var rankMap: UserRankMap = {};
	// for each star
	for (const [starRef, starData] of toListStarMap(starMap)) {
		addStarUserRankMap(starRef, starData, rankMap, virtFlag, extFlag);
	}
	// combine whenever valid
	for (const [userKey, userRankMap] of Object.entries(rankMap)) {
		// -- uses this cache to avoid repeating star defs
		var starCache: { [key: string]: number } = {};
		for (const [starRef, starData] of toListStarMap(starMap)) {
			const starDef = starRef.starDef;
			const simpleCode = starDef.stageId + "_" + starDef.id;
			if (starCache[simpleCode] === undefined && canCombStarRef(starDef)) {
				tryCombStarMap(userRankMap, starDef, takeBetterRank, null);
				starCache[simpleCode] = 0;
			}
		}
	}
	/*for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var starDef = starSet[i][j][0];
			var baseKey = i + "_" + starDef.id;
			// read alts separately if offset or diff case
			var hasAlt = false;
			var canComb = false;
			if (starDef.alt === null) {
			} else if (starDef.alt.status === "offset" || starDef.alt.status === "mergeOffset") {
				hasAlt = true;
				canComb = true;
			} else if (starDef.alt.status === "cutscene" || starDef.alt.status === "diff") { hasAlt = true; }
			// add rank stats
			var mainAlt: [boolean, boolean] = [true, true];
			if (hasAlt) mainAlt = [true, false];
			addStarUserRankMap(f, i, starDef, rankMap, virtFlag, extFlag, mainAlt);
			if (hasAlt) addStarUserRankMap(f, i, starDef, rankMap, virtFlag, extFlag, [false, true]);
			// complete the user rank map
			if (canComb) combStarUserRankMap(baseKey, rankMap);
		}
	}*/
	return rankMap;
}



/*
export type UserRankStore = {
	bestMap: UserRankMap,
	extMap: UserRankMap
};*/

/*function addStarUserRankMap(f: StarLoadFun, starDef: StarDef,
	rankMap: UserRankMap, virtFlag: boolean, extFlag: ExtState, altState: [boolean, boolean])
{
	//const starKey = stageId + "_" + starDef.id;
	// build filter state
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var fs = newFilterState(altState, virtFlag, varTotal);
	fs.verState = [true, true];
	fs.extFlag = extFlag;
	// build time table
	var colList = colListStarDef(starDef, fs);
	var verOffset = verOffsetStarDef(starDef, fs);
	var stratOffset = stratOffsetStarDef(starDef, fs);
	var timeTable = f(starDef.stageId, starDef, colList, verOffset, stratOffset);
	// iterate through time table
	for (const userDat of timeTable)
	{
		// lookup user's rank map
		var userKey = keyIdent(userDat.id);
		if (rankMap[userKey] === undefined) rankMap[userKey] = { "dat": {} };
		var userRankMap = rankMap[userKey].dat;
		// lookup star in rank map
		if (userMap[starKey] === undefined) userMap[starKey] = { "mainRank": "Unranked" };
		var rankData = userMap[starKey];
		// go through time row
		for (let i = 0; i < userDat.timeRow.length; i++) {
			const multiDat = userDat.timeRow[i];
			if (multiDat === null) continue;
			var stratDef = colList[i][1];
			for (const timeDat of multiDat) {
				var rank = getRank(G_SHEET.srMap, starKey, timeDat);
				if (altState[0] && stratDef.diff !== "second") rankData.mainRank = betterRank(rank, rankData.mainRank);
				else if (altState[1] && stratDef.diff === "second") {
					rankData.altRank = betterRank(rank, rankData.altRank);
				}
			}
		}
	}
}

function combStarUserRankMap(starKey: string, rankMap: UserRankMap)
{
	// iterate through user
	for (const userEntry of Object.entries(rankMap))
	{
		const [userKey, starMap] = userEntry;
		var rankData = starMap[starKey];
		if (rankData === undefined) continue;
		if (rankData.altRank === undefined) rankData.combRank = rankData.mainRank;
		else rankData.combRank = betterRank(rankData.mainRank, rankData.altRank);
	}
}*/

/*export function calcUserRankMap(f: StarLoadFun, starSet: StarDef[], virtFlag: boolean, extFlag: ExtState): UserRankMap
{
	var rankMap: UserRankMap = {};
	// for each star
	// for each star
	for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var starDef = starSet[i][j][0];
			var baseKey = i + "_" + starDef.id;
			// read alts separately if offset or diff case
			var hasAlt = false;
			var canComb = false;
			if (starDef.alt === null) {
			} else if (starDef.alt.status === "offset" || starDef.alt.status === "mergeOffset") {
				hasAlt = true;
				canComb = true;
			} else if (starDef.alt.status === "cutscene" || starDef.alt.status === "diff") { hasAlt = true; }
			// add rank stats
			var mainAlt: [boolean, boolean] = [true, true];
			if (hasAlt) mainAlt = [true, false];
			addStarUserRankMap(f, i, starDef, rankMap, virtFlag, extFlag, mainAlt);
			if (hasAlt) addStarUserRankMap(f, i, starDef, rankMap, virtFlag, extFlag, [false, true]);
			// complete the user rank map
			if (canComb) combStarUserRankMap(baseKey, rankMap);
		}
	}
	return rankMap;
}*/

/*
export function calcUserRankStore(starSet: [StarDef, number][][]): UserRankStore
{
	return {
		"bestMap": calcUserRankMap(starSet, false),
		"extMap": calcUserRankMap(starSet, true)
	};
}*/