
import { keyIdent } from "../time_table"

import { UserRankMap, UserStarRankMap } from '../standards/user_ranks'
import { StxStarMap, statKey, starOnlyKey } from './stats_star_map'
import { UserStatMap, UserStats, getStarUserStats } from './stats_user_map'

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
		// base pts
	basePts: number,
		// standard
	rank: string,
	rankPts: number,
		// strat saver
	bestStrat: string,
	stratPts: number,
		// total pts
	totalPts: number
}

export type StarScoreMetaMap = {
	[key: string]: StarScoreMeta
}

function calcStarScoreMap(starMap: StxStarMap, userSx: UserStats, rankMap: UserStarRankMap): StarScoreMetaMap
{
	// for every star
	const starScoreMap: StarScoreMetaMap = {};
	for (const [starKey, starDat] of Object.entries(starMap))
	{
		// obtain user score for star
		const userScore = getStarUserStats(userSx, starDat.stageId, starDat.starId, starDat.alt.state);
		if (userScore === null) continue;
		// get star rank
		const [starKeyBase, starAlt] = starOnlyKey(starDat);
		var rankName = "Unranked";
		var rankData = rankMap[starKeyBase];
		// - use combined rank if nothing specified, otherwise use main / alt
		if (rankData !== undefined) {
			if (starAlt.state === null && rankData.combRank) rankName = rankData.combRank;
			else if (starAlt.state === "alt" && rankData.altRank) rankName = rankData.altRank;
			else if (starAlt.state !== "alt") rankName = rankData.mainRank;
		}
		// find best strat
		var bestStrat = "-";
		var bestPts = 0;
		for (const [stratKey, stratScore] of Object.entries(userScore.stratMap)) {
			if (stratScore.scorePts > bestPts) {
				bestStrat = stratScore.timeDat.rowDef.name;
				bestPts = stratScore.scorePts;
			}
		}
		// fill in info
		const basePts = userScore.scorePts * 60;
		bestPts = bestPts * 20;
		starScoreMap[starKey] = {
			"basePts": basePts,
			"rank": rankName,
			"rankPts": RANK_PTS[rankName],
			"bestStrat": bestStrat,
			"stratPts": bestPts,
			"totalPts": (Math.floor(basePts * 10) + (RANK_PTS[rankName] * 10) + Math.floor(bestPts * 10)) / 10
		};
	}
	return starScoreMap;
}

	/*
		DS scoring algorithm per-user:
	*/

export type UserScoreMeta = {
	starMap: StarScoreMetaMap
};

export type UserScoreMetaMap = {
	[key: string]: UserScoreMeta
}

export function calcDSScore(starMap: StxStarMap, userMap: UserStatMap, rankMap: UserRankMap): UserScoreMetaMap
{
	const userScoreMap: UserScoreMetaMap = {};
	for (const [userKey, userSx] of Object.entries(userMap.stats))
	{
		const userRankMap = rankMap[userKey];
		if (userRankMap === undefined) continue;
		const userMeta: UserScoreMeta = { "starMap": calcStarScoreMap(starMap, userSx, userRankMap) };
		userScoreMap[userKey] = userMeta;
	}
	return userScoreMap;
}