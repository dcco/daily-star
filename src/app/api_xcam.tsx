import orgData from './json/org_data.json'
import localRowData from './json/row_data.json'
import localXcamData from './json/xcam_dump.json'

import rawSRData from './json/star_ranks.json'

import { DEV } from './rx_multi_board'

import { newIdent } from './time_table'
import { StarDef, orgStarDef } from './org_star_def'
import { xcamTTFun } from './xcam_time_table'
import { StxStarMap } from './stats/stats_star_map'
import { UserScoreMap, UserStatMap, calcUserScoreMap, calcUserStatMap } from './stats/stats_user_map'

import { SRMap, genStarRankMap } from './standards/strat_ranks'

	/* 
		permanent storage for xcam data
		-- back references types for stratmap + playermap
	*/

export type SheetData = {
	"rowData": any,
	"xcamData": any,
		// stats
	"starMap": StxStarMap | null,
	"scoreMap": UserScoreMap | null,
	"userMap": UserStatMap | null,
	"extStarMap": StxStarMap | null,
	"altMap": { [key: string]: UserStatMap },
		// strat ranks
	"secretMap": UserStatMap | null,
	"srMap": SRMap
};

export const G_SHEET: SheetData = {
	"rowData": localRowData,
	"xcamData": localXcamData,
	"starMap": null,
	"scoreMap": null,
	"userMap": null,
	"extStarMap": null,
	"altMap": {},
	"secretMap": null,
	"srMap": {}
};

export async function initGSheet(callback: () => void)
{
	// initial calc
	calcStatData();
	calcStratRankData();
	G_SHEET.srMap = rawSRData as SRMap;
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
	calcStratRankData();
	callback();
}

function calcStatData()
{
	var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));
	var [starMap, scoreMap] = calcUserScoreMap(starSet, xcamTTFun, false);
	var [fullStarMap, scoreExtMap] = calcUserScoreMap(starSet, xcamTTFun, true);
	// if in dev mode, we use the "cheater" ranks (dont care about fill rate)
	var userMap = calcUserStatMap(starSet, scoreMap, false, newIdent("xcam", "Nobody"), DEV);
	var userMapSplit = calcUserStatMap(starSet, scoreMap, true, newIdent("xcam", "Nobody"), false);
	var extMap = calcUserStatMap(starSet, scoreExtMap, false, newIdent("xcam", "Nobody"), false);
	var extMapSplit = calcUserStatMap(starSet, scoreExtMap, true, newIdent("xcam", "Nobody"), false);
	G_SHEET.starMap = starMap;
	G_SHEET.extStarMap = fullStarMap;
	G_SHEET.userMap = userMap;
	G_SHEET.altMap = {
		"split": userMapSplit,
		"ext": extMap,
		"ext_split": extMapSplit
	};
	if (DEV) G_SHEET.secretMap = calcUserStatMap(starSet, scoreMap, false, newIdent("xcam", "Nobody"), true);
}

function calcStratRankData()
{
	var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));
	if (DEV) G_SHEET.srMap = genStarRankMap(starSet);
	//console.log(G_SHEET.srMap);
}
