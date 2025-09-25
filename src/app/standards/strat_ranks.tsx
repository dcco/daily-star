import { G_SHEET } from '../api_xcam'

import { TimeRow, TimeTable } from "../time_table"
import { PlayData } from '../play_data'
import { ColList } from "../org_strat_def"

	/* standard assignment 

const STANDARD: [string, number][] = [
		["Atmpas", 100],
		["Mario", 95],
		["Grandmaster", 90],
		["Master", 80],
		["Diamond", 70],
		["Platinum", 60],
		["Gold", 45],
		["Silver", 25]
	];*/

export type StratTimes = {
	times: [string, number][]
};

export type StratTimeSet = {
	[key: string]: StratTimes
};

function getStratTime(timeRow: TimeRow, stratName: string): number | null
{
	var bestTime: number | null = null;
	for (const mDat of timeRow) {
		if (mDat === null) continue;
		for (const tDat of mDat) {
			if (tDat.rowDef.name === stratName) {
				if (bestTime === null || tDat.time < bestTime) bestTime = tDat.time; 
			}
		}
	}
	return bestTime;
}

export function genStratRanks(colList: ColList, tt: TimeTable): StratTimeSet
{
	var ss: StratTimeSet = {};
	// for each strat
	for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		var stratName = stratDef.name;
		// for each time, collect relevant times
		var st: StratTimes = { "times": [] };
		for (const userDat of tt) {
			var uTime = getStratTime(userDat.timeRow, stratName);
			if (uTime !== null) {
				// get player standard
				var playStd = "Unranked";
				if (G_SHEET.userMap !== null) {
					var playDat = G_SHEET.userMap.stats["xcam@" + userDat.id.name];
					if (playDat !== undefined) playStd = playDat.standard;
				}
				st.times.push([playStd, uTime]);
			}
		}
		ss[stratName] = st;
	}
	return ss;
}
