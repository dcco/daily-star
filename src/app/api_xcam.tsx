import orgData from './json/org_data.json'
import localRowData from './json/row_data.json'
import localXcamData from './json/xcam_dump.json'

import { StarDef, orgStarDef } from './org_star_def'
import { StxStarMap } from './stats/stats_star_map'
import { UserScoreMap, UserStatMap, calcUserScoreMap, calcUserStatMap } from './stats/stats_user_map'

	/* 
		permanent storage for xcam data
		-- back references types for stratmap + playermap
	*/

export type SheetData = {
	"rowData": any,
	"xcamData": any,
	"starMap": StxStarMap | null,
	"scoreMap": UserScoreMap | null,
	"userMap": UserStatMap | null,
	"userMapSplit": UserStatMap | null
};

export const G_SHEET: SheetData = {
	"rowData": localRowData,
	"xcamData": localXcamData,
	"starMap": null,
	"scoreMap": null,
	"userMap": null,
	"userMapSplit": null
};

export async function initGSheet(callback: () => void)
{
	// initial calc
	calcStatData();
	//const getReq = await fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5505/dump_xcams");
	const getReq = await fetch("https://g6u2bjvfoh.execute-api.us-east-2.amazonaws.com/dump_xcams");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return;
	}
	if (res.res === undefined) {
		console.log(res);
		console.log("Failed to load xcam data with unknown issue.");
		return;
	}
	var [newRD, newXD] = res.res;
	G_SHEET.rowData = newRD;
	G_SHEET.xcamData = newXD;
	console.log("Succesfully loaded online xcam data.");
	calcStatData();
	callback();
}

function calcStatData()
{
	var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));
	var [starMap, scoreMap] = calcUserScoreMap(starSet);
	var userMap = calcUserStatMap(starSet, scoreMap, false);
	var userMapSplit = calcUserStatMap(starSet, scoreMap, true);
	G_SHEET.starMap = starMap;
	G_SHEET.userMap = userMap;
	G_SHEET.userMapSplit = userMapSplit;
}

	/*
		data for the entire range of players
	*/

/*
type PlayerStatMap = {
	stats: { [key: string]: PlayerStats },
	starTotal: number
};

function newStatMap(): PlayerStatMap
{
	return { "stats": {}, "starTotal": 0 };
}*/


/*
function calcPlayData()
{
	// for every stage/star, collect records + times
	var timeMap = getStarTimeMap();
	G_SHEET.stratMap = timeMap;
	// get rank data for all strats
	var userMap: UserTimeMap = {};
	for (const [key, data] of Object.entries(timeMap)) {
		// find best time / ranks per user
		var bestList = getUserTimeList(data);
		userMap[key] = [data, bestList];
	}
	// for every star w/ alt "cutscene" or "mergeOffset", we merge their best rankings
	for (let i = 0; i < orgData.length; i++) {
		var starTotal = orgData[i].starList.length;
		for (let j = 0; j < starTotal; j++) {
			// build strat key
			var starDef = orgStarDef(i, j);
			var baseKey = i + "_" + starDef.id;
			if (starDef.alt !== null && (starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) {
				var mainDat = userMap[baseKey];
				var altDat = userMap[baseKey + "_alt"];
				if (mainDat === undefined || altDat === undefined) continue;
				var newBestList = mergeUserTimeList(mainDat[1], altDat[1]);
				delete userMap[baseKey + "_alt"];
				userMap[baseKey] = [mainDat[0], newBestList];
			}
		}
	}
	// score players per star
	var statMap = newStatMap();
	// for each entry, gives pts to a player
	for (const [key, [data, bestList]] of Object.entries(userMap)) {
		for (const bestDat of bestList) {
			addScoreStatMap(statMap, data, bestDat);
		}
	}
	statMap.starTotal = Object.entries(userMap).length;
	G_SHEET.playerMap = statMap;
	// standards + incomplete stars calc
	calcStandardsStatMap(statMap);
	var refList: [StarRef, number][] = Object.values(userMap).map((ref) => [ref[0], ref[1].length]);
	for (const name of Object.keys(statMap.stats)) {
		markIncompleteStatMap(statMap, name, refList);
	}
}*/