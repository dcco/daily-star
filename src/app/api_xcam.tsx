import orgData from './json/org_data.json'
import localRowData from './json/row_data.json'
import localXcamData from './json/xcam_dump.json'

import rawSRData from './json/star_ranks.json'

import { DEV } from './rx_multi_board'

import { newIdent } from './time_table'
import { StarDef, orgStarId, orgStarDef } from './org_star_def'
import { xcamTTFun } from './xcam_time_table'
import { SRMap, genStarRankMap } from './standards/strat_ranks'
import { UserStatMap, calcSimpleScoreMap, calcUserStatMap } from './stats/stats_user_map'
import { ScoreCache, initScoreCache } from './stats/score_cache'

/*import { StxStarMap } from './stats/stats_star_map'
import { UserScoreMap, UserStatMap, calcUserScoreMap, calcUserStatMap } from './stats/stats_user_map'

import { UserRankStore, calcUserRankStore } from './standards/user_ranks'*/

	/* 
		permanent storage for xcam data
		-- back references types for stratmap + playermap
	*/

export type SheetData = {
	"rowData": any,
	"xcamData": any,
	"extra": any,
	"srMap": SRMap,
	"scoreData": ScoreCache | null,
	"secretMap": UserStatMap | null
		// stats
	/*"starMap": StxStarMap | null,
	"scoreMap": UserScoreMap | null,
	"userMap": UserStatMap | null,
	"extStarMap": StxStarMap | null,
	"altMap": { [key: string]: UserStatMap },
		// strat ranks
	"secretMap": UserStatMap | null,
	"userRankStore": UserRankStore | null*/
};

export const G_SHEET: SheetData = {
	"rowData": localRowData,
	"xcamData": localXcamData,
	"extra": {},
	"srMap": { "dat": {} },
	"scoreData": null,
	"secretMap": null
	/*"starMap": null,
	"scoreMap": null,
	"userMap": null,
	"extStarMap": null,
	"altMap": {},
	"srMap": {},
	"userRankStore": null*/
};

	// we need this because currently the old sr map is a different datatype
function prepSRData()
{
	var r: any = {};
	for (const [starKey, starDat] of Object.entries(rawSRData)) {
		var n = starKey.split("_");
		var stageId = parseInt(n[0]);
		var starId = orgStarId(stageId, n[1]);
		r[starKey] = {
			"v": starDat,
			"star": orgStarDef(stageId, starId)
		};
	}
	G_SHEET.srMap.dat = r;
}

export async function initGSheet(callback: () => void)
{
	// initial calc
	if (DEV) remakeSRMap();
	calcStatData();
	//G_SHEET.srMap.dat = rawSRData as any;
	prepSRData();
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
	var [newRD, newXD, extraXD] = res.res;
	G_SHEET.rowData = newRD;
	G_SHEET.xcamData = newXD;
	G_SHEET.extra = extraXD ? extraXD.extra : undefined;
	console.log("Succesfully loaded online xcam data.");
	calcStatData();
	calcStratRankData();
	callback();
}

export function rawExCellCheck(i: number, j: number): string | null
{
	if (G_SHEET.extra === undefined) return null;
	const ex = G_SHEET.extra;
	if (ex.values === undefined) return null;
	const vs = ex.values;
	if (vs[j] === undefined) return null;
	const row = vs[j];
	if (row[i] === undefined) return null;
	if (row[i].value === undefined) return null;
	return row[i].value;
}

function calcStatData()
{
	/*var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));*/
	var starSet: StarDef[] = [];
	orgData.map((stage, i) => {
		stage.starList.map((starDef, j) => {
			starSet.push(orgStarDef(i, j));
		});
	});
	G_SHEET.scoreData = initScoreCache(starSet, xcamTTFun, false);
	// this map only exists to give player ranks for rank creation
	if (DEV) {
		var [starMap, scoreMap] = calcSimpleScoreMap(starSet, xcamTTFun, null, false);
		G_SHEET.secretMap = calcUserStatMap(starSet, scoreMap, false, false, newIdent("xcam", "Nobody"), true);
	}
	/*var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));
	var [starMap, scoreMap] = calcUserScoreMap(starSet, xcamTTFun, false);
	var [fullStarMap, scoreExtMap] = calcUserScoreMap(starSet, xcamTTFun, true);
	// if in dev mode, we use the "cheater" ranks (dont care about fill rate)
	var userMap = calcUserStatMap(starSet, scoreMap, false, newIdent("xcam", "Nobody"), ALTER_RANKS);
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
	*/
}

function calcStratRankData()
{
	// will NOT generate new ranks unless DEV mode is turned on
	/*var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));
	if (DEV) G_SHEET.srMap = genStarRankMap(starSet);
	G_SHEET.userRankStore = calcUserRankStore(starSet);*/
	//console.log(G_SHEET.srMap);
}

function remakeSRMap()
{
	/*var starSet: [StarDef, number][][] = orgData.map((stage, i) =>
		stage.starList.map((starDef, j) => [orgStarDef(i, j), j]));*/
	var starSet: StarDef[] = [];
	orgData.map((stage, i) => {
		stage.starList.map((starDef, j) => {
			starSet.push(orgStarDef(i, j));
		});
	});
	G_SHEET.srMap = genStarRankMap(starSet);
	console.log(G_SHEET.srMap);
}
