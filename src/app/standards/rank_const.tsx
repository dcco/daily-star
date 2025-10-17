import { G_SHEET } from '../api_xcam'

import { TimeDat } from "../time_dat"
import { TimeRow, TimeTable } from "../time_table"

	/*
		rank time coL: data structure represent a column of player ranks + times
	*/

export type RankTimeCol = [string, TimeDat][];

	/* given user time data + column id, returns user's time for strat if applicable */
function getStratTime(timeRow: TimeRow, colId: number): TimeDat | null
{
	var mDat = timeRow[colId];
	if (mDat === null) return null;
	var bestTime: TimeDat | null = null;
	for (const tDat of mDat) {
		if (bestTime === null || tDat.time < bestTime.time) bestTime = tDat; 
	}
	return bestTime;
	/*
	var bestTime: TimeDat | null = null;
	for (const mDat of timeRow) {
		if (mDat === null) continue;
		for (const tDat of mDat) {
			if (tDat.rowDef.name === stratName) {
				if (bestTime === null || tDat.time < bestTime.time) bestTime = tDat; 
			}
		}
	}
	return bestTime;*/
}

export function getTimeCol(tt: TimeTable, colId: number): RankTimeCol
{
	/*
		INITIAL TIME/RANK PULL
	*/
	// collects relevant times + player ranks from the timetable
	var times: [string, TimeDat][] = [];
	for (const userDat of tt) {
		var uTime = getStratTime(userDat.timeRow, colId);
		if (uTime !== null) {
			// get player standard
			var playStd = "Unranked";
			if (G_SHEET.secretMap !== null) {
				var playDat = G_SHEET.secretMap.stats["xcam@" + userDat.id.name];
				if (playDat !== undefined) playStd = playDat.standard;
			}
			times.push([playStd, uTime]);
		}
	}
	times.sort(function (a, b) { return a[1].time - b[1].time; });
	return times;
}

	/*
		constant functions for rank names
		TODO: currently duplicated in stats/stats_user_map
		- consolidate the information (although stats_user_map has slightly different numbers)
	*/

export const RANK_NAME_LIST: [string, number][] = [
		["Mario", 95],
		["Grandmaster", 90],
		["Master", 80],
		["Diamond", 73],
		["Platinum", 65],
			// these numbers have been modified to get desired multipliers
		["Gold", 55],
		["Silver", 45],
		["Bronze", 10],
		["Iron", 0]
	];

type RankMap = { [key: string]: number };

export const RANK_NAME_MAP: RankMap = {
	"Mario": 0,
	"Grandmaster": 1,
	"Master": 2,
	"Diamond": 3,
	"Platinum": 4,
	"Gold": 5,
	"Silver": 6,
	"Bronze": 7,
	"Iron": 8
};

	/*
		time column calc functions based on the rank names			
	*/

	// SKILL METRIC CALCULATION
	// calculate "over performance" of gold/silver/bronze players
export function skillMetricTimeCol(times: RankTimeCol): number
{
	var overPerfRank = 0;
	for (let i = 0; i < Math.ceil(times.length * 0.75); i++) {
		var [playStd, timeDat] = times[i];
		if ((RANK_NAME_MAP[playStd] === 5 && i < Math.ceil(times.length * 0.55)) ||
			RANK_NAME_MAP[playStd] >= 6) overPerfRank = overPerfRank + 1;
	}
	if (times.length !== 0) overPerfRank = overPerfRank / Math.ceil(times.length * 0.75);
	// square to increase the strength
	// multiplied by 2.8 to approximately scale ~.357 back to itself
	overPerfRank = overPerfRank * overPerfRank * 2.8;
	return overPerfRank;
}

	// RANK RANGE CALCULATION
	// calculate how many players of each rank have a time
	// - with certain adjustments
export function tallyRanksTimeCol(times: RankTimeCol, skillMetric: number): number[]
{
	var skillEx = 1 + Math.min(skillMetric, 0.35);
	var rankPlayRate: number[] = Array(RANK_NAME_LIST.length).fill(0);
	for (const timeInfo of times) {
		var [playStd, timeDat] = timeInfo;
		var rankNum = RANK_NAME_MAP[playStd];
		if (rankNum === undefined) rankNum = rankPlayRate.length - 1;
		rankPlayRate[rankNum] = rankPlayRate[rankNum] + 1;
	}
	// rank adjustments:
	// - skip grandmaster, shift everything else
	// - adjust based on skill metric
	var marioRate = rankPlayRate[0];
	if (rankPlayRate[0] > 15) rankPlayRate[0] = 14 + Math.ceil((rankPlayRate[0] - 14) * 0.5);
	//rankPlayRate[1] = rankPlayRate[1] + rankPlayRate[2];
	rankPlayRate[1] = rankPlayRate[1] + rankPlayRate[2] + (marioRate - rankPlayRate[0]);
	for (let i = 2; i <= 6; i++) {
		rankPlayRate[i] = rankPlayRate[i + 1];
		rankPlayRate[i] = Math.round(rankPlayRate[i] * skillEx);
	}
	// - add X% of GM points to diamond + master (make GM + master harder)
	var t1 = Math.floor(rankPlayRate[1] * 0.33);
	var t2 = Math.floor(rankPlayRate[1] * 0.17);
	rankPlayRate[1] = rankPlayRate[1] - (t1 + t2);
	rankPlayRate[2] = rankPlayRate[2] + t2;
	rankPlayRate[3] = rankPlayRate[3] + t1;
	// - re-distribute gold range into gold + silver, kill bronze
	var goldRate = rankPlayRate[5] + Math.floor(rankPlayRate[6] * 0.1);
	rankPlayRate[5] = Math.ceil(goldRate * 0.6);
	rankPlayRate[6] = 0;//goldRate - rankPlayRate[5];
	rankPlayRate[7] = 0;
	return rankPlayRate;
}