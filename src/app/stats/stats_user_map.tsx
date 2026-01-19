
import { StarLoadFun } from '../api_history'

import { zeroRowDef } from '../row_def'
import { TimeDat, maxTimeDat } from '../time_dat'
import { Ident, keyIdent } from '../time_table'
import { toSetColList } from '../org_strat_def'
import { ExtState, StarDef } from '../org_star_def'
import { AltType, AltTypeEx, StarRef, StarMap, canCombStarRef, tryCombStarMap, starCodeFull,
	addStarMap, toListStarMap, newStarMapAlt, newStarMapAltEx, cleanupStarMap } from '../star_map'
//import { StarMapAlt, AltState, lookupStarMapAlt, addStarMapAlt, toListStarMapAlt } from '../star_map'
import { StxStarData, StxStarMap, getStarTimeMap } from './stats_star_map'

	/*
		user score: user score data for a specific star
	*/

export type StratScore = {
	timeDat: TimeDat,
	rank: [number, number],
	scorePts: number
}

export type UserScore = StarRef<AltType> & StratScore & {
	comp: true,
	srcAlt: AltType,
	id: Ident,
	stratMap: { [key: string]: StratScore },
	obsolete: UserScore[]
};

export function newUserScore(ref: StarRef<AltType>, id: Ident, timeDat: TimeDat): UserScore
{
	return {
		"comp": true,
		"stageId": ref.stageId,
		"starDef": ref.starDef,
		"alt": ref.alt,
		"srcAlt": ref.alt,
		//"100c": ref["100c"],
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

function getUserRankSet(data: StxStarData, stratName: string | null): [Ident, StratScore][]
{
	// find best time for all users (either globally, or for given strat)
	var bestList: [Ident, StratScore][] = [];
	data.timeTable.map((userDat) => {
		var bestDat: TimeDat | null = null;
		for (const multiDat of userDat.timeRow) {
			if (multiDat === null) continue;
			for (const timeDat of multiDat) {
				if (bestDat === null || timeDat.time < bestDat.time) {
					if (stratName === null || timeDat.rowDef.name === stratName) bestDat = timeDat;
				}
			}
		}
		if (bestDat !== null) bestList.push([userDat.id, {
			"timeDat": bestDat,
			"rank": [-1, 0],
			"scorePts": 0
		}]);
	})
	// sort by time, generate score
	bestList.sort(function (a, b) { return a[1].timeDat.time - b[1].timeDat.time; });
	// assign ranks
	var rank = 0;
	var lastTime = 999900;
	bestList.map((bestScore, ix) => {
		const bestDat = bestScore[1];
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

function getUserScoreList(data: StxStarData): UserScore[]
{
	// calculate scores for each player + each strat
	var [stratSet, indexSet] = toSetColList(data.colList);
	var bestList = getUserRankSet(data, null);
	var stratBestTable: [string, [Ident, StratScore][]][] = Object.entries(stratSet).map(function (_strat) {
		return [_strat[0], getUserRankSet(data, _strat[0])];
	})
	// initialize user scores
	var uMap: { [key: string]: UserScore } = {};
	for (const [id, tempScore] of bestList) {
		var newScore = newUserScore(data, id, tempScore.timeDat);
		newScore.rank = tempScore.rank;
		newScore.scorePts = tempScore.scorePts;
		uMap[keyIdent(id)] = newScore;
	}
	// fill in strat map with remainder of strats
	for (const [stratName, stratBestList] of stratBestTable) {
		for (const [id, tempScore] of stratBestList) {
			var score = uMap[keyIdent(id)];
			score.stratMap[stratName] = tempScore;
		}
	}
	// flatten and return
	var finalList = Object.entries(uMap).map((entry) => entry[1]);
	finalList.sort(function (a, b) { return a.timeDat.time - b.timeDat.time; });
	return finalList;
}
/*
function getUserScoreList(data: StxStarData): UserScore[]
{
	// calculate best time for each player
	var [stratSet, indexSet] = toSetColList(data.colList);
	var bestList: UserScore[] = data.timeTable.map((userDat) => {
		//var stratMap: { [key: string]: StratScore } = {};
		var bestDat = maxTimeDat(zeroRowDef("Open"));
		for (const multiDat of userDat.timeRow) {
			if (multiDat === null) continue;
			//var bestStrat: TimeDat | null = null;
			for (const timeDat of multiDat) {
				if (timeDat.time < bestDat.time) bestDat = timeDat;
				//if (bestStrat === null || timeDat.time < bestStrat.time) bestStrat = timeDat;
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
		score.stratMap = {};
		return score;
	});
	// calculate rank per individual strat
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
}*/

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

export type SimpleScoreMap = StarMap<AltTypeEx, UserScore[]>;

	/*
		takes a list of stars, produces a list of user scores for each one		
	*/
function _calcSimpleScoreMap(starSet: StarDef[], starMap: StxStarMap): SimpleScoreMap
{
	// get rank data for all strats
	var scoreMap: SimpleScoreMap = newStarMapAltEx();
	for (const [starRef, starData] of toListStarMap(starMap)) {
		// find best time / ranks per user
		var bestList = getUserScoreList(starData);
		if (bestList.length > 0) addStarMap(scoreMap, starRef, bestList);
	}
	// for every star w/ alt "cutscene" or "mergeOffset", we merge their best rankings
	for (const starDef of starSet) {
		if (canCombStarRef(starDef)) {
			tryCombStarMap<AltTypeEx, UserScore[]>(scoreMap, starDef, mergeUserScoreList, "comb");
		}
	}

	// for every star w/ alt "cutscene" or "mergeOffset", we merge their best rankings
	/*for (let i = 0; i < starSet.length; i++) {
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
	}*/
	return scoreMap;
}

	/*
		copies the user score map, but removes
	*/
/*export function filterScoreMap(starSet: StarDef[], scoreMap: SimpleScoreMap, split: boolean): SimpleScoreMap
{
	var newScoreMap: SimpleScoreMap = { "dat": {} };
	for (const star of starSet) {

	}
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
}*/

	/*
		inc score: auxiliary object representing score data for a star that a user has not completed
	*/

export type IncScore = StarRef<AltType> & {
	comp: false,
	srcAlt: AltType,
	timeDat: TimeDat | null,
	rank: number | null,
	playTotal: number
};

export function newIncScore(ref: StarRef<AltType>, total: number): IncScore
{
	return {
		"comp": false,
		"stageId": ref.stageId,
		"starDef": ref.starDef,
		"alt": ref.alt,
		"srcAlt": ref.alt,
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

export type UserStats = {
	id: Ident,
	starList: UserScore[],
	complete: { [key: string]: number },
	incomplete: { [key: string]: IncScore },
	standard: string
};

export function fillIncompleteStats(userSx: UserStats, refList: [string, StarRef<AltType>, number][])
{
	for (const [key, ref, total] of refList) {
		if (userSx.complete[key] === undefined) {
			userSx.incomplete[key] = newIncScore(ref, total);
		}
	}
}

export function calcTopXStats(userSx: UserStats, x: number, descale: boolean): number
{
	// assumes that user stats are already sorted during the standards function
	var ix = 0;
	var topX = 0;
	for (const star of userSx.starList) {
		if (ix >= x) break;
		topX = topX + star.scorePts;
		ix = ix + 1;
	}
	if (descale && ix !== 0) return (topX * 100) / ix;
	return (topX * 100) / x;
}

export function calcTop100cStats(userSx: UserStats, x: number): number
{
	// assumes that user stats are already sorted during the standards function
	var ix = 0;
	var topX = 0;
	for (const star of userSx.starList) {
		if (ix >= x) break;
		if (star.starDef["100c"]) {
			topX = topX + star.scorePts;
			ix = ix + 1;
		}
	}
	return (topX * 100) / x;
}

export function filterUserStats(userSx: UserStats, codeList: [number, string][]): UserStats
{
	var codeMap: { [key: string]: number } = {};
	for (const [stageId, starId] of codeList) codeMap[stageId + "_" + starId] = 0;
	
	var newStarList = userSx.starList.filter((userScore) => {
		return codeMap[userScore.stageId + "_" + userScore.starDef.id] !== undefined;
	});
	newStarList.sort(function (a, b) { return rankPts(b.rank) - rankPts(a.rank) });

	var newSx: UserStats = {
		"id": userSx.id,
		"starList": newStarList,
		"complete": {},
		"incomplete": {},
		"standard": userSx.standard
	};
	for (const key of Object.keys(codeMap)) {
		if (userSx.complete[key]) newSx.complete[key] = userSx.complete[key];
		if (userSx.incomplete[key]) newSx.incomplete[key] = userSx.incomplete[key];
	};
	return newSx;
}

export function getStarUserStats(userSx: UserStats, starRef: StarRef<AltType>): UserScore | null
{
	var code = starCodeFull(starRef);
	/*var code = stageId + "_" + starId;
	if (alt.state !== null && alt.source !== "all") code = code + "_" + alt.state;*/
	if (userSx.complete[code] !== undefined) {
		for (const star of userSx.starList) {
			if (code === starCodeFull(star)) return star; 
			/*if (star.stageId === stageId && star.starId === starId) {
				if (alt.state === null || star.alt.state === alt.state) return star;
			}*/
		}
	}
	return null;
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

export function fillIncompleteStatMap(statMap: UserStatMap, refList: [string, StarRef<AltType>, number][])
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

export function fillStandardsStatMap(statMap: UserStatMap, descale: boolean)
{
	for (const [userKey, userSx] of Object.entries(statMap.stats)) {
		userSx.starList.sort(function (a, b) { return b.scorePts - a.scorePts; });
		if (!descale && userSx.starList.length < 20) continue;
		var top30 = calcTopXStats(userSx, 30, descale);
		// standard calculated after rounding since a player will normally see their rounded score
		userSx.standard = getStandard(Math.round(top30 * 100) / 100);
	}
}

	/*
		main user stat map calc function
	*/

export function calcSimpleScoreMap(starSet: StarDef[], f: StarLoadFun, extFlag: ExtState, verifFlag: boolean): [StxStarMap, SimpleScoreMap]
{
	// for every stage/star, collect records + times
	var starMap = getStarTimeMap(f, starSet, extFlag, verifFlag);
	// calc user scores from star map data
	var scoreMap = _calcSimpleScoreMap(starSet, starMap);
	return [starMap, scoreMap];
}

	/*
		starSet: list of stars + indices for generating statistics
		scoreMap: pre-generated map of user scores per star
		split: determines whether to grade "offset" stars separately
		dsFlag: changes how mergeOffset stars are scored
		nobody: adds mr nobody to the statistics
		descale: whether to allow users without the requisite number of stars to have a scaled up score
	*/

export function calcUserStatMap(starSet: StarDef[], scoreMap: SimpleScoreMap,
	split: boolean, dsFlag: boolean, nobody: Ident | null, descale: boolean): UserStatMap
{
	// filter based on split type
	//scoreMap = filterScoreMap(starSet, scoreMap, split);
	var _scoreMap = cleanupStarMap(starSet, scoreMap, split, dsFlag);
	// score players per star [convert user score map -> user stats]
	const _scoreList = toListStarMap(_scoreMap);
	const statMap = newUserStatMap(_scoreList.length);
	for (const [ref, bestList] of _scoreList) {
		const cKey = starCodeFull(ref);
		for (const bestDat of bestList) {
			addScoreStatMap(statMap, cKey, bestDat);
		}
	}
	/*var statMap = newUserStatMap(Object.entries(scoreMap).length);
	for (const [cKey, bestList] of Object.entries(scoreMap)) {
		for (const bestDat of bestList) {
			addScoreStatMap(statMap, cKey, bestDat);
		}
	}*/
	// add mr nobody
	if (nobody !== null) safeLookupStatMap(statMap, nobody);
	// standards + incomplete stars calc
	fillStandardsStatMap(statMap, descale);
	/*var refList: [string, StarRef, number][] = Object.entries(scoreMap).map((entry) => {
		var [key, ref] = entry;
		return [key, ref[0], ref.length]
	});*/
	var refList: [string, StarRef<AltType>, number][] = _scoreList.map(([ref, bestList]) => {
		return [starCodeFull(ref), ref, bestList.length];
	})
	fillIncompleteStatMap(statMap, refList);
	return statMap;
}

export type FilterCodeList = [number, string][];

	/* filters a user stat map based on a list of star codes */
export function filterUserStatMap(userMap: UserStatMap, codeList: FilterCodeList): UserStatMap
{
	var newMap: UserStatMap = {
		stats: {},
		starTotal: codeList.length
	};
	for (const [userKey, userSx] of Object.entries(userMap.stats)) {
		newMap.stats[userKey] = filterUserStats(userSx, codeList);
	}
	return newMap;
}