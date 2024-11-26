import orgData from './json/org_data.json'
import localRowData from './json/row_data.json'
import localXcamData from './json/xcam_dump.json'

import { zeroRowDef } from './row_def'
import { TimeDat, VerOffset, maxTimeDat } from './time_dat'
import { TimeTable, filterTimeTable } from './time_table'
import { ColList, filterVarColList } from './org_strat_def'
import { FilterState, StarDef, newFilterState, orgStarDef, verOffsetStarDef, colListStarDef } from './org_star_def'
import { RecordMap, xcamRecordMap } from './xcam_record_map'
import { xcamTimeTable } from './xcam_time_table'

export type StratTimeData = {
	"stageId": number,
	"starId": string,
	"alt": number,
	"vs": VerOffset,
	"recordMap": RecordMap,
	"timeTable": TimeTable
};

export type StratTimeMap = {
	[key: string]: StratTimeData
};

export type SheetData = {
	"rowData": any,
	"xcamData": any,
	"stratMap": StratTimeMap | null,
	"playerMap": PlayerStatMap | null
};

export const G_SHEET: SheetData = {
	"rowData": localRowData,
	"xcamData": localXcamData,
	"stratMap": null,
	"playerMap": null
};

export async function initGSheet(callback: () => void)
{
	// initial calc
	calcPlayData();
	//const getReq = await fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5505/dump_xcams");
	const getReq = await fetch("https://g6u2bjvfoh.execute-api.us-east-2.amazonaws.com/dump_xcams");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return;
	}
	var [newRD, newXD] = res.res;
	G_SHEET.rowData = newRD;
	G_SHEET.xcamData = newXD;
	console.log("Succesfully loaded online xcam data.");
	calcPlayData();
	callback();
}

export type StarRef = {
	comp: "false",
	stageId: number,
	starId: string,
	alt: number,
	total: number
};

export type StarStats = {
	comp: "true",
	stageId: number,
	starId: string,
	alt: number,
	rank: [number, number],
	allStratTime: TimeDat,
	allStratPts: number
};

type PlayerStats = {
	starList: StarStats[],
	complete: { [key: string]: number },
	incomplete: { [key: string]: StarRef },
	standard: string
};

type PlayerStatMap = {
	stats: { [key: string]: PlayerStats },
	total: number
};

const STANDARD: [string, number][] = [
		["Mario", 95],
		["Grandmaster", 90],
		["Master", 80],
		["Diamond", 70],
		["Platinum", 60],
		["Gold", 45]
	];

function getStandard(n: number): string
{
	for (let i = 0; i < STANDARD.length; i++) {
		if (n >= STANDARD[i][1]) return STANDARD[i][0];
	}
	return "Silver";
}

function getTimeData(stageId: number, starDef: StarDef, colList: ColList, alt: number | null, fs: FilterState): StratTimeData
{
	// read raw data
	var verOffset = verOffsetStarDef(starDef, fs);
	var timeTable = xcamTimeTable(colList, verOffset);
	// transform into filtered data
	var filterColList = filterVarColList(colList, alt);
	var relRM = xcamRecordMap(filterColList, fs, verOffset);
	timeTable = filterTimeTable(timeTable, filterColList);
	return {
		"stageId": stageId,
		"starId": starDef.id,
		"alt": 0,
		"vs": verOffset,
		"recordMap": relRM,
		"timeTable": timeTable
	};
}

function calcPlayData()
{
	// collect stratified records + times per star
	var stratMap: StratTimeMap = {};
	var stageTotal = orgData.length;
	for (let i = 0; i < stageTotal; i++) {
		var starTotal = orgData[i].starList.length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var starDef = orgStarDef(i, j);
			var key = i + "_" + starDef.id;
			// no extension data
			var fs = newFilterState(false);
			fs.verState = [true, true];
			// regular + variant if relevant
			var colList = colListStarDef(starDef, fs);
			if (colList.length === 0) continue;		
			stratMap[key] = getTimeData(i, starDef, colList, null, fs);	
			if (starDef.short.length > 1) {
				var stratData = getTimeData(i, starDef, colList, 1, fs);
				if (stratData.timeTable.length !== 0) {
					stratMap[key + "_alt"] = stratData;
					stratData.alt = 1;
				}
			}
		}
	}
	G_SHEET.stratMap = stratMap;
	// collect player stats per star
	var playerAll: PlayerStatMap = { "stats": {}, "total": 0 };
	var playerMap = playerAll.stats;
	for (const [key, data] of Object.entries(stratMap)) {
		// find best time per user
		var bestList = data.timeTable.map((userDat) => {
			var bestDat = maxTimeDat(zeroRowDef("Open"));
			for (const multiDat of userDat.timeRow) {
				if (multiDat === null) continue;
				for (const timeDat of multiDat) {
					if (timeDat.time < bestDat.time) bestDat = timeDat;
				}
			}
			return { "id": userDat.id, "timeDat": bestDat };
		});
		bestList = bestList.filter(function (a) { return a.timeDat.time < 999900; });
		bestList.sort(function (a, b) { return a.timeDat.time - b.timeDat.time; });
		// add data for player
		var ix = 0;
		var rank = 0;
		var lastTime = 999900;
		for (const bestDat of bestList) {
			var name = bestDat.id.name;
			if (playerMap[name] === undefined) {
				playerMap[name] = { 'starList': [], "complete": {}, "incomplete": {}, "standard": "Unranked" };
			}
			if (bestDat.timeDat.time !== lastTime) {
				lastTime = bestDat.timeDat.time;
				rank = ix;
			}
			playerMap[name].complete[key] = 0;
			playerMap[name].starList.push({
				'comp': "true",
				'stageId': data.stageId,
				'starId': data.starId,
				'alt': data.alt,
				'rank': [rank, bestList.length],
				'allStratTime': bestDat.timeDat,
				'allStratPts': (bestList.length - rank) / bestList.length
			});
			ix = ix + 1;
		}
	}
	playerAll.total = Object.entries(stratMap).length;
	G_SHEET.playerMap = playerAll;
	// standards calculation
	for (const [name, player] of Object.entries(playerMap))	{
		if (player.starList.length < 20) continue;
		player.starList.sort(function (a, b) { return b.allStratPts - a.allStratPts; });
		var ix = 0;
		var top30 = 0;
		for (const star of player.starList) {
			if (ix === 30) break;
			top30 = top30 + star.allStratPts;
			ix = ix + 1;
		}
		player.standard = getStandard(Math.round(top30 * 10000 / 30) / 100);
	}
	// find incomplete stars for each user
	for (const [name, player] of Object.entries(playerMap)) {
		for (const [key, data] of Object.entries(stratMap)) {
			if (player.complete[key] === undefined) {
				player.incomplete[key] = {
					'comp': "false",
					'stageId': data.stageId,
					'starId': data.starId,
					'alt': data.alt,
					'total': data.timeTable.length
				};
			}
		}
	}
}