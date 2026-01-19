
import { Ident, keyIdent } from '../time_table'
import { hasFlagStratRule } from '../org_rules'
import { AltType, StarRef, StarMap, starKeyExtern, canCombStarRef, eitherCombStarMap,
	lookupStarMap, addStarMap, toListStarMap, starCodeW, newStarMapAlt } from '../star_map'

import { UserRankMap, UserStarRankMap } from '../standards/user_ranks'
import { StxStarMap } from './stats_star_map'
import { UserStatMap, UserStats, StratScore, FilterCodeList, getStarUserStats } from './stats_user_map'

	// bonus points for rank cut-offs

type RankMap = { [key: string]: number };

export const RANK_PTS: RankMap = {
	"Atmpas": 20,
	"Mario": 20,
	"Grandmaster": 18,
	"Master": 17,
	"Diamond": 15,
	"Platinum": 13,
	"Gold": 10,
	"Silver": 8,
	"Bronze": 5,
	"Iron": 2,
	"Unranked": 0
};

	/*
		DS scoring algorithm per-star:
		- 60pts: overall ranking
		- 20pts: std ranking
		- 20pts: per-strat ranking
	*/

export type StarScoreMeta = {
	"100c": boolean,
		// base pts
	basePts: number,
	basePlace: [number, number],
		// standard
	rank: string,
	rankPts: number,
		// strat saver
	bestStrat: string | null,
	stratPts: number,
	stratPlace: [number, number],
		// total pts
	totalPts: number
}

export type StarScoreMetaMap = StarMap<AltType, StarScoreMeta>

function calcStarScoreMap(userSx: UserStats, rankMap: UserStarRankMap): StarScoreMetaMap
{
	// for every star
	const starScoreMap: StarScoreMetaMap = newStarMapAlt();
	for (const userScore of userSx.starList) {
		// get star rank
		var rankName = "Unranked";
		{
			var _rankName = lookupStarMap(rankMap, userScore);
			if (_rankName !== null) rankName = _rankName;
		}
		// find best strat
		const starDef = userScore.starDef;
		var stratFlag = !hasFlagStratRule(starKeyExtern(starDef.stageId, starDef), "noStratScore");
		var bestScore: StratScore | null = null;
		if (stratFlag) {
			for (const [stratKey, stratScore] of Object.entries(userScore.stratMap)) {
				if (bestScore === null || stratScore.scorePts >= bestScore.scorePts) bestScore = stratScore;
			}
		}
		// fill in info
		const basePts = userScore.scorePts * (stratFlag ? 60 : 80);
		const bestPts = bestScore !== null ? bestScore.scorePts * 20 : 0;
		addStarMap(starScoreMap, userScore, {
			"100c": starDef["100c"],
			"basePts": basePts,
			"basePlace": userScore.rank,
			"rank": rankName,
			"rankPts": RANK_PTS[rankName],
			"bestStrat": bestScore !== null ? bestScore.timeDat.rowDef.name : null,
			"stratPts": bestPts,
			"stratPlace": bestScore !== null ? bestScore.rank : [-1, 0],
			"totalPts": (Math.floor(basePts * 10) + (RANK_PTS[rankName] * 10) + Math.floor(bestPts * 10)) / 10
		});
	}
	// go through combine-able (cutscene) stars
	for (const userScore of userSx.starList) {
		const starDef = userScore.starDef;
		if (canCombStarRef(starDef)) {
			eitherCombStarMap(starScoreMap, starDef, function (a, b) {
				if (a.totalPts > b.totalPts) return a;
				return b;
			}, null);
		}
	}
		// find best strat
	/*	var stratFlag = !hasFlagStratRule(starCodeX(starDat.stageId, starDat.starId), "noStratScore");
		var bestScore: StratScore | null = null;
		if (stratFlag) {
			for (const [stratKey, stratScore] of Object.entries(userScore.stratMap)) {
				if (bestScore === null || stratScore.scorePts >= bestScore.scorePts) bestScore = stratScore;
			}
		}
		// fill in info
		const basePts = userScore.scorePts * (stratFlag ? 60 : 80);
		const bestPts = bestScore !== null ? bestScore.scorePts * 20 : 0;
		starScoreMap[starKey] = {
			"baseKey": baseKey,
			"100c": starDat["100c"],
			"basePts": basePts,
			"basePlace": userScore.rank,
			"rank": rankName,
			"rankPts": RANK_PTS[rankName],
			"bestStrat": bestScore !== null ? bestScore.timeDat.rowDef.name : null,
			"stratPts": bestPts,
			"stratPlace": bestScore !== null ? bestScore.rank : [-1, 0],
			"totalPts": (Math.floor(basePts * 10) + (RANK_PTS[rankName] * 10) + Math.floor(bestPts * 10)) / 10
		};
	}*/
	return starScoreMap;
}

/*function calcStarScoreMap(starMap: StxStarMap, userSx: UserStats, rankMap: UserStarRankMap): StarScoreMetaMap
{
	// for every star
	const starScoreMap: StarScoreMetaMap = {};
	for (const [starKey, starDat] of Object.entries(starMap))
	{
		// obtain user score for star
		const userScore = getStarUserStats(userSx, starDat.stageId, starDat.starId, starDat.alt);
		if (userScore === null) continue;
		// get star rank
		const [baseKey, starAlt] = starOnlyKey(starDat);
		if (baseKey === "15_wmotr") console.log(starKey);
		var rankName = "Unranked";
		var rankData = rankMap[baseKey];
		// - use combined rank if nothing specified, otherwise use main / alt
		if (rankData !== undefined) {
			if (starAlt.state === null && rankData.combRank) rankName = rankData.combRank;
			else if (starAlt.state === "alt" && rankData.altRank) rankName = rankData.altRank;
			else if (starAlt.state !== "alt") rankName = rankData.mainRank;
		}
		// find best strat
		var stratFlag = !hasFlagStratRule(starCodeX(starDat.stageId, starDat.starId), "noStratScore");
		var bestScore: StratScore | null = null;
		if (stratFlag) {
			for (const [stratKey, stratScore] of Object.entries(userScore.stratMap)) {
				if (bestScore === null || stratScore.scorePts >= bestScore.scorePts) bestScore = stratScore;
			}
		}
		// fill in info
		const basePts = userScore.scorePts * (stratFlag ? 60 : 80);
		const bestPts = bestScore !== null ? bestScore.scorePts * 20 : 0;
		starScoreMap[starKey] = {
			"baseKey": baseKey,
			"100c": starDat["100c"],
			"basePts": basePts,
			"basePlace": userScore.rank,
			"rank": rankName,
			"rankPts": RANK_PTS[rankName],
			"bestStrat": bestScore !== null ? bestScore.timeDat.rowDef.name : null,
			"stratPts": bestPts,
			"stratPlace": bestScore !== null ? bestScore.rank : [-1, 0],
			"totalPts": (Math.floor(basePts * 10) + (RANK_PTS[rankName] * 10) + Math.floor(bestPts * 10)) / 10
		};
	}
	return starScoreMap;
}*/

	/*
		DS scoring algorithm per-user:
	*/

export type UserScoreMeta = {
	id: Ident,
	starMap: StarScoreMetaMap
};

export type UserScoreMetaMap = {
	[key: string]: UserScoreMeta
}

export function calcDSScore(userMap: UserStatMap, rankMap: UserRankMap): UserScoreMetaMap
{
	const userScoreMap: UserScoreMetaMap = {};
	for (const [userKey, userSx] of Object.entries(userMap.stats))
	{
		const userRankMap = rankMap[userKey];
		if (userRankMap === undefined) continue;
		const userMeta: UserScoreMeta = {
			"id": userSx.id,
			"starMap": calcStarScoreMap(userSx, userRankMap)
		};
		userScoreMap[userKey] = userMeta;
	}
	return userScoreMap;
}

export function findWinnerDSScore(userMap: UserScoreMetaMap, starRef: StarRef<AltType>): Ident[]
{
	var bestScore = -1;
	var bestUserList: Ident[] = [];
	for (const [userKey, userMeta] of Object.entries(userMap)) {
		const starScore = lookupStarMap(userMeta.starMap, starRef);
		if (starScore === null) continue;
		if (starScore.totalPts > bestScore) {
			bestScore = starScore.totalPts;
			bestUserList = [userMeta.id];
		} else if (starScore.totalPts === bestScore) {
			bestUserList.push(userMeta.id);
		}
	}
	/*for (const [userKey, userMeta] of Object.entries(userMap)) {
		if (userMeta.starMap[starKey] !== undefined) {
			var starScore = userMeta.starMap[starKey];
			if (starScore.totalPts > bestScore) {
				bestScore = starScore.totalPts;
				bestUserList = [userMeta.id];
			} else if (starScore.totalPts === bestScore) {
				bestUserList.push(userMeta.id);
			}
		}
	}*/
	return bestUserList;
}

	/*
		equivalents from stats_user_map
	*/

export function calcTopXStats_DS(userSx: UserScoreMeta, x: number): number
{
	// sort star list
	//var starList: [string, StarScoreMeta][] = Object.entries(userSx.starMap);
	var starList = toListStarMap(userSx.starMap);
	starList.sort((a, b) => b[1].totalPts - a[1].totalPts);
	// calculate score
	var ix = 0;
	var topX = 0;
	for (const [_starKey, star] of starList) {
		if (ix >= x) break;
		topX = topX + star.totalPts;
		ix = ix + 1;
	}
	return topX / x;
}

export function calcTop100cStats_DS(userSx: UserScoreMeta, x: number): number
{	
	// sort star list
	//var starList: [string, StarScoreMeta][]  = Object.entries(userSx.starMap);
	var starList = toListStarMap(userSx.starMap);
	starList.sort((a, b) => b[1].totalPts - a[1].totalPts);
	// calculate score
	var ix = 0;
	var topX = 0;
	for (const [_starRef, star] of starList) {
		if (ix >= x) break;
		if (star["100c"]) {
			topX = topX + star.totalPts;
			ix = ix + 1;
		}
	}
	return topX / x;
}

function filterUserMeta(userMeta: UserScoreMeta, codeList: FilterCodeList): UserScoreMeta
{
	var codeMap: { [key: string]: number } = {};
	for (const [stageId, starId] of codeList) codeMap[stageId + "_" + starId] = 0;

	var newMeta: UserScoreMeta = {
		"id": userMeta.id,
		"starMap": newStarMapAlt()
	};
	for (const [starRef, starScore] of toListStarMap(userMeta.starMap)) {
		const baseKey = starCodeW(starRef.starDef);
		if (codeMap[baseKey] !== undefined) addStarMap(newMeta.starMap, starRef, starScore); 
	}/*
	for (const [starKey, starScore] of Object.entries(userMeta.starMap)) {
		const baseKey = starScore.baseKey;
		if (codeMap[baseKey] !== undefined) newMeta.starMap[starKey] = starScore; 
	};*/
	return newMeta;
}

export function filterUserMetaMap(userMap: UserScoreMetaMap, codeList: FilterCodeList): UserScoreMetaMap
{
	var newMap: UserScoreMetaMap = {};
	for (const [userKey, userMeta] of Object.entries(userMap)) {
		newMap[userKey] = filterUserMeta(userMeta, codeList);
	}
	return newMap;
}