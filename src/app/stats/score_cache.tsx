import { ALTER_RANKS } from '../rx_multi_board'

import { newIdent } from '../time_table'
import { StarDef, ExtState } from '../org_star_def'
import { StarLoadFun } from '../api_history'

import { UserRankMap, calcUserRankMap } from '../standards/user_ranks'
import { StxStarMap } from './stats_star_map'
import { UserStatMap, calcSimpleScoreMap, calcUserStatMap } from './stats_user_map'
import { UserScoreMetaMap, calcDSScore } from './ds_scoring'

//import { UserScoreMap, UserStatMap,  } from './stats/stats_user_map'

	/*
		score_filter: an object representing the type of scoring information desired
		- extFlag: extensions allowed /
			applies special bans / allowances according to rank_struct.json
		- verifFlag: requires times to be verified
		- splitFlag: splits alternate stars (time stop vs time moving, etc)
	*/

export type ScoreFilter = {
	extFlag: ExtState,
	verifFlag: boolean,
	splitFlag: boolean
}

export function newScoreFilter(extFlag: ExtState, splitFlag: boolean, verifFlag: boolean): ScoreFilter
{
	return {
		"extFlag": extFlag,
		"verifFlag": verifFlag,
		"splitFlag": splitFlag
	};
}

	/*
		certain flags (rn just the split flag) dont affect the time calculations, only
		 the final scoring phase. the star code is used to encompass this idea
	*/

function _starCodeScoreFilter(extFlag: ExtState, verifFlag: boolean): string
{
	var vs = verifFlag ? "verif$" : "";
	if (extFlag === "ext") return vs + "ext$";
	else if (extFlag === "rules") return vs + "rules$";
	//if (fsx.rulesFlag) return vs + "rules$";
	return vs + "";
}

export function starCodeScoreFilter(fsx: ScoreFilter): string
{
	return _starCodeScoreFilter(fsx.extFlag, fsx.verifFlag);
}

export function fullCodeScoreFilter(fsx: ScoreFilter): string
{
	var code = starCodeScoreFilter(fsx);
	if (fsx.splitFlag) code = code + "split$";
	return code;
}

	/*
		score_cache: wrapper object that allows star / user scores to be accessed w/ caching
			based on arbitrary filters (extensions, etc)
	*/

type StxStarCache = { [key: string]: StxStarMap };
type UserStatCache = { [key: string]: UserStatMap };
type UserRankCache = { [key: string]: UserRankMap };
type DSScoreCache = { [key: string]: UserScoreMetaMap };

export type ScoreCache = {
	star: StxStarCache,
	user: UserStatCache,
	rank: UserRankCache,
	dsScore: DSScoreCache | null
};

/*
	-- we prefer to have a null score cache rather than an empty one
export function newScoreCache(): ScoreCache
{
	return { "star": {}, "user": {}, "rank": {} };
}
*/

export function initScoreCache(starSet: StarDef[], f: StarLoadFun, dsFlag: boolean): ScoreCache
{
	const scoreData: ScoreCache = { "star": {}, "user": {}, "rank": {}, "dsScore": dsFlag ? {} : null };
	// for each combo of extension / split
	const vfs = dsFlag ? [false, true] : [false];
	const efs: ExtState[] = dsFlag ? [null, "rules", "ext"] : [null, "ext"];
	const sfs = dsFlag ? [false] : [false, true];
	for (const verifFlag of vfs) {
		for (const extFlag of efs) {
			// calculate relevant star map
			var [starMap, scoreMap] = calcSimpleScoreMap(starSet, f, extFlag, verifFlag);
			var starCode = _starCodeScoreFilter(extFlag, verifFlag);
			scoreData.star[starCode] = starMap;
			// calculate use score data
			for (const splitFlag of sfs) {
				const fsx = newScoreFilter(extFlag, splitFlag, verifFlag);
				const userMap = calcUserStatMap(starSet, scoreMap, splitFlag, dsFlag, newIdent("xcam", "Nobody"), ALTER_RANKS);
				scoreData.user[fullCodeScoreFilter(fsx)] = userMap;
			}
			// calculate rank data
			const rankMap = calcUserRankMap(starMap, dsFlag ? true : false, extFlag);
			scoreData.rank[starCode] = rankMap;
			// calculate daily star scores
			if (scoreData.dsScore === null) continue;
			const mainUserMap = scoreData.user[starCode];
			const dsScore = calcDSScore(mainUserMap, rankMap);
			scoreData.dsScore[starCode] = dsScore;
			/*for (const splitFlag of [false, true]) {
				const fsx = newScoreFilter(extFlag, splitFlag, verifFlag);
				const fullCode = fullCodeScoreFilter(fsx);
				const mainUserMap = scoreData.user[fullCode];
				scoreData.dsScore[fullCode] = calcDSScore(starMap, mainUserMap, rankMap);
			}*/
		}
	}
	return scoreData;
}

export function getUserDataScoreCache(cache: ScoreCache, fsx: ScoreFilter): [StxStarMap, UserStatMap]
{
	const starCode = starCodeScoreFilter(fsx);
	const fullCode = fullCodeScoreFilter(fsx);
	return [cache.star[starCode], cache.user[fullCode]];
}

export function getRankScoreCache(cache: ScoreCache, fsx: ScoreFilter): UserRankMap
{
	const fullCode = starCodeScoreFilter(fsx);
	return cache.rank[fullCode];
}

export function getDSScoreCache(cache: ScoreCache, fsx: ScoreFilter): UserScoreMetaMap
{
	const dsScore = cache.dsScore;
	if (dsScore === null) throw("BUG: score_cache.tsx - Attempted to use uninitialized DS score cache.");
	const fullCode = starCodeScoreFilter(fsx);
	return dsScore[fullCode];
}

export function getDSScoreCacheSafe(cache: ScoreCache, fsx: ScoreFilter): UserScoreMetaMap | null
{
	const dsScore = cache.dsScore;
	if (dsScore === null) return null;
	const fullCode = starCodeScoreFilter(fsx);
	return dsScore[fullCode];
}