
import { StarLoadFun } from '../api_season'

import { zeroRowDef } from '../row_def'
import { TimeDat, maxTimeDat } from '../time_dat'
import { Ident, keyIdent } from '../time_table'
import { toSetColList } from '../org_strat_def'
import { StarDef } from '../org_star_def'
import { StarRef, StxStarData, StxStarMap, getStarTimeMap } from './stats_star_map'

	/*
		user score: user score data for a specific star
	*/

export type StratScore = {
	timeDat: TimeDat,
	rank: [number, number],
	scorePts: number
}

export type UserScore = StarRef & StratScore & {
	comp: true,
	id: Ident,
	stratMap: { [key: string]: StratScore },
	obsolete: UserScore[]
};

export function newUserScore(ref: StarRef, id: Ident, timeDat: TimeDat): UserScore
{
	return {
		"comp": true,
		"stageId": ref.stageId,
		"starId": ref.starId,
		"alt": ref.alt,
		"id": id,
		"timeDat": timeDat,
		"rank": [-1, 0],
		"scorePts": 0,
		"stratMap": {},
		"obsolete": []
	};
}

export function rankPts(rank: [number, number]): number
{
	return (rank[1] - rank[0]) / rank[1];
}

function getUserScoreList(data: StxStarData): UserScore[]
{
	// calculate best time for each player
	var [stratSet, indexSet] = toSetColList(data.colList);
	var bestList: UserScore[] = data.timeTable.map((userDat) => {
		var stratMap: { [key: string]: StratScore } = {};
		var bestDat = maxTimeDat(zeroRowDef("Open"));
		for (const multiDat of userDat.timeRow) {
			if (multiDat === null) continue;
			var bestStrat: TimeDat | null = null;
			for (const timeDat of multiDat) {
				if (timeDat.time < bestDat.time) bestDat = timeDat;
				if (bestStrat === null || timeDat.time < bestStrat.time) bestStrat = timeDat;
			}
			if (bestStrat !== null) stratMap[bestStrat.rowDef.name] = {
				"timeDat": bestStrat,
				"rank": [-1, 0],
				"scorePts": 0
			};
		}
		// secondary status
		var stratName = bestDat.rowDef.name;
		var alt: null | "main" | "alt" = null;
		if (data.alt !== null) {
			if (stratSet[stratName].diff.includes("second")) alt = "alt";
			else alt = "main";
		}
		// fill out best scores + per strat scores
		var score = newUserScore(data, userDat.id, bestDat);
		score.stratMap = stratMap;
		return score;
	});
	// filter + sort
	bestList = bestList.filter(function (a) { return a.timeDat.time < 999900; });
	bestList.sort(function (a, b) { return a.timeDat.time - b.timeDat.time; });
	// assign ranks
	var rank = 0;
	var lastTime = 999900;
	bestList.map((bestDat, ix) => {
		if (bestDat.timeDat.time !== lastTime) {
			lastTime = bestDat.timeDat.time;
			rank = ix;
		}
		var rankTotal = bestList.length;
		//if (rankTotal < 100) rankTotal = 100;
		bestDat.rank = [rank, rankTotal];
		bestDat.scorePts = rankPts(bestDat.rank);
	});
	return bestList;
}

function mergeUserScoreList(l1: UserScore[], l2: UserScore[]): UserScore[]
{
	var uMap: { [key: string]: UserScore } = {};
	l1.concat(l2).map((userScore: UserScore) => {
		var key = keyIdent(userScore.id);
		if (uMap[key] === undefined) uMap[key] = userScore;
		else if (rankPts(userScore.rank) > rankPts(uMap[key].rank)) {
			userScore.obsolete.push(uMap[key]);
			uMap[key] = userScore;
		} else {
			uMap[key].obsolete.push(userScore);
		}
	});
	var newList = Object.entries(uMap).map((entry) => entry[1]);
	newList.sort(function (a, b) { return rankPts(b.rank) - rankPts(a.rank) });
	return newList;
}

	/*
		user score map: auxiliary mapping of star keys -> user score lists
			(compare user stat maps which map user keys -> user score lists + stats)
	*/

export type UserScoreMap = {
	[key: string]: UserScore[]
};

function _calcUserScoreMap(starSet: [StarDef, number][][], starMap: StxStarMap): UserScoreMap
{
	// get rank data for all strats
	var scoreMap: UserScoreMap = {};
	for (const [key, starData] of Object.entries(starMap)) {
		// find best time / ranks per user
		var bestList = getUserScoreList(starData);
		if (bestList.length > 0) scoreMap[key] = bestList;
	}
	// for every star w/ alt "cutscene" or "mergeOffset", we merge their best rankings
	for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var starDef = starSet[i][j][0];
			var baseKey = i + "_" + starDef.id;
			// score merging
			if (starDef.alt !== null && (starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) {
				var mainDat = scoreMap[baseKey + "_main"];
				var altDat = scoreMap[baseKey + "_alt"];
				if (mainDat === undefined) scoreMap[baseKey + "_comb"] = altDat;
				else if (altDat === undefined) scoreMap[baseKey + "_comb"] = mainDat;
				else scoreMap[baseKey + "_comb"] = mergeUserScoreList(mainDat, altDat);
			}
		}
	}
	return scoreMap;
}

export function filterScoreMap(starSet: [StarDef, number][][], scoreMap: UserScoreMap, split: boolean): UserScoreMap
{
	var newScoreMap: UserScoreMap = {};
	// iterate through every star
	for (let i = 0; i < starSet.length; i++) {
		var starTotal = starSet[i].length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var starDef = starSet[i][j][0];
			var baseKey = i + "_" + starDef.id;
			// simple case
			if (starDef.alt === null) {
				newScoreMap[baseKey] = scoreMap[baseKey];
			} else if (starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset") {
				// for combination cases, we always want only the combination
				newScoreMap[baseKey] = scoreMap[baseKey + "_comb"];
			} else if (starDef.alt.status === "offset") {
				// offset case differs based on splitting
				if (split) {
					newScoreMap[baseKey + "_main"] = scoreMap[baseKey + "_main"];
					newScoreMap[baseKey + "_alt"] = scoreMap[baseKey + "_alt"];
				} else newScoreMap[baseKey] = scoreMap[baseKey];
			} else if (starDef.alt.status === "diff") {
				// diff case always keeps both
				newScoreMap[baseKey + "_main"] = scoreMap[baseKey + "_main"];
				newScoreMap[baseKey + "_alt"] = scoreMap[baseKey + "_alt"];
			}
		}
	}
	for (const key of Object.keys(newScoreMap)) {
		if (newScoreMap[key] === undefined) delete newScoreMap[key];
	}
	return newScoreMap;
}

	/*
		inc score: auxiliary object representing score data for a star that a user has not completed
	*/

export type IncScore = StarRef & {
	comp: false,
	timeDat: TimeDat | null,
	rank: number | null,
	playTotal: number
};

export function newIncScore(ref: StarRef, total: number): IncScore
{
	return {
		"comp": false,
		"stageId": ref.stageId,
		"starId": ref.starId,
		"alt": ref.alt,
		"timeDat": null,
		"rank": null,
		"playTotal": total
	};
}

export function fullScoreList(scoreList: UserScore[], altFlag: boolean): (IncScore | UserScore)[]
{
	var retList: (IncScore | UserScore)[] = [];
	for (const userScore of scoreList) {
		retList.push(userScore);
		if (altFlag) {
			for (const obsScore of userScore.obsolete) {
				var incScore = newIncScore(obsScore, obsScore.rank[1]);
				incScore.timeDat = obsScore.timeDat;
				incScore.rank = obsScore.rank[0];
				incScore.playTotal = obsScore.rank[1];
				retList.push(incScore);
			}
		}
	}
	return retList;
}

	/*
		user stats: user score/stats for a pool of stars
	*/

type UserStats = {
	id: Ident,
	starList: UserScore[],
	complete: { [key: string]: number },
	incomplete: { [key: string]: IncScore },
	standard: string
};

export function fillIncompleteStats(userSx: UserStats, refList: [string, StarRef, number][])
{
	for (const [key, ref, total] of refList) {
		if (userSx.complete[key] === undefined) {
			userSx.incomplete[key] = newIncScore(ref, total);
		}
	}
}

export function calcTopXStats(userSx: UserStats, x: number): number
{
	// assumes that user stats are already sorted during the standards function
	var ix = 0;
	var topX = 0;
	for (const star of userSx.starList) {
		if (ix >= x) break;
		topX = topX + star.scorePts;
		ix = ix + 1;
	}
	return (topX * 100) / x;
}

/*
export function completeStatsList(starList: StarStats[], altFlag: boolean): (UserScore | IncScore)[]
{
	var retList: (IncStarRef | StarStats)[] = [];
	for (const starDat of starList) {
		retList.push(starDat);
		if (altFlag && starDat.obsolete !== null) {
			var [ref, userTime] = starDat.obsolete;
			retList.push({
				"weak": true,
				"stageId": ref.stageId,
				"starId": ref.starId,
				"alt": userTime.alt,
				"rank": userTime.rank[0],
				"timeDat": userTime.timeDat,
				"playTotal": userTime.rank[1]
			});
		}
	}
	return retList;
}*/

	/*
		user stat map: user data for the entire range of players
	*/

export type UserStatMap = {
	stats: { [key: string]: UserStats },
	starTotal: number
};

export function newUserStatMap(total: number): UserStatMap
{
	return { "stats": {}, "starTotal": total };
}

export function safeLookupStatMap(statMap: UserStatMap, id: Ident): UserStats
{
	var userMap = statMap.stats;
	var key = keyIdent(id);
	// add player if doesn't exist yet
	if (userMap[key] === undefined) {
		var newStats: UserStats =  { 'id': id, 'starList': [], "complete": {}, "incomplete": {}, "standard": "Unranked" };
		statMap.stats[key] = newStats;
		return newStats;
	}
	return userMap[key];
}

export function addScoreStatMap(statMap: UserStatMap, cKey: string, userScore: UserScore)
{
	var userSx = safeLookupStatMap(statMap, userScore.id);
	// add score data
	userSx.complete[cKey] = 0;
	userSx.starList.push(userScore);
}

export function fillIncompleteStatMap(statMap: UserStatMap, refList: [string, StarRef, number][])
{
	for (const userSx of Object.values(statMap.stats)) {
		fillIncompleteStats(userSx, refList);
	}
}

	/* standard assignment */

const STANDARD: [string, number][] = [
		["Atmpas", 100],
		["Mario", 95],
		["Grandmaster", 90],
		["Master", 80],
		["Diamond", 70],
		["Platinum", 60],
		["Gold", 45],
		["Silver", 25]
	];

function getStandard(n: number): string
{
	for (let i = 0; i < STANDARD.length; i++) {
		if (n >= STANDARD[i][1]) return STANDARD[i][0];
	}
	return "Bronze";
}

export function fillStandardsStatMap(statMap: UserStatMap)
{
	for (const [userKey, userSx] of Object.entries(statMap.stats)) {
		userSx.starList.sort(function (a, b) { return b.scorePts - a.scorePts; });
		if (userSx.starList.length < 20) continue;
		var top30 = calcTopXStats(userSx, 30);
		// standard calculated after rounding since a player will normally see their rounded score
		userSx.standard = getStandard(Math.round(top30 * 100) / 100);
	}
}

	/*
		main user stat map calc function
	*/

export function calcUserScoreMap(starSet: [StarDef, number][][], f: StarLoadFun, extFlag: boolean): [StxStarMap, UserScoreMap]
{
	// for every stage/star, collect records + times
	var starMap = getStarTimeMap(f, starSet, extFlag);
	// calc user scores from star map data
	var scoreMap = _calcUserScoreMap(starSet, starMap);
	return [starMap, scoreMap];
}

export function calcUserStatMap(starSet: [StarDef, number][][], scoreMap: UserScoreMap, split: boolean, nobody: Ident | null): UserStatMap
{
	// filter based on split type
	scoreMap = filterScoreMap(starSet, scoreMap, split);
	// score players per star [convert user score map -> user stats]
	var statMap = newUserStatMap(Object.entries(scoreMap).length);
	for (const [cKey, bestList] of Object.entries(scoreMap)) {
		for (const bestDat of bestList) {
			addScoreStatMap(statMap, cKey, bestDat);
		}
	}
	// add mr nobody
	if (nobody !== null) safeLookupStatMap(statMap, nobody);
	// standards + incomplete stars calc
	fillStandardsStatMap(statMap);
	var refList: [string, StarRef, number][] = Object.entries(scoreMap).map((entry) => {
		var [key, ref] = entry;
		return [key, ref[0], ref.length]
	});
	fillIncompleteStatMap(statMap, refList);
	return statMap;
}
