import { G_SHEET } from '../api_xcam'

import { TimeDat } from '../time_dat'
import { keyIdent } from '../time_table'
import { StarDef, newFilterState, colListStarDef,
	verOffsetStarDef, stratOffsetStarDef } from '../org_star_def'
import { xcamTimeTable } from '../xcam_time_table'

import { getRank, betterRank } from '../standards/strat_ranks'

export type BestRankData = {
	mainRank: string,
	altRank?: string,
	combRank?: string
};

export type UserStarRankMap = {
	[key: string]: BestRankData
};

export type UserRankMap = {
	[key: string]: UserStarRankMap
};

export type UserRankStore = {
	bestMap: UserRankMap,
	extMap: UserRankMap
};

function addStarUserRankMap(starKey: string, starDef: StarDef, rankMap: UserRankMap, extFlag: boolean, altState: [boolean, boolean])
{
	// build filter state
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var fs = newFilterState(altState, false, varTotal);
	fs.verState = [true, true];
	fs.extFlag = extFlag;
	// build time table
	var colList = colListStarDef(starDef, fs);
	var verOffset = verOffsetStarDef(starDef, fs);
	var stratOffset = stratOffsetStarDef(starDef, fs);
	var timeTable = xcamTimeTable(colList, verOffset, stratOffset);
	// iterate through time table
	for (const userDat of timeTable)
	{
		// read user + star name
		var userKey = keyIdent(userDat.id);
		if (rankMap[userKey] === undefined) rankMap[userKey] = {};
		var userMap = rankMap[userKey];
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
}

export function calcUserRankMap(starSet: [StarDef, number][][], extFlag: boolean): UserRankMap
{
	var rankMap: UserRankMap = {};
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
			addStarUserRankMap(baseKey, starDef, rankMap, extFlag, mainAlt);
			if (hasAlt) addStarUserRankMap(baseKey, starDef, rankMap, extFlag, [false, true]);
			// complete the user rank map
			if (canComb) combStarUserRankMap(baseKey, rankMap);
		}
	}
	return rankMap;
}

export function calcUserRankStore(starSet: [StarDef, number][][]): UserRankStore
{
	return {
		"bestMap": calcUserRankMap(starSet, false),
		"extMap": calcUserRankMap(starSet, true)
	};
}