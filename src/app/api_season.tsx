
import { ReadTimeObj, ReadAnyTimeObj } from './api_types'
import { loadTTRaw } from './api_live'

import { VerOffset, StratOffset } from './time_dat'
import { TimeTable, newIdent } from './time_table'
import { ColList } from './org_strat_def'
import { StarDef, orgStageTotal, orgStarId, orgStarDef } from './org_star_def'

import { StxStarMap } from './stats/stats_star_map'
import { UserScoreMap, UserStatMap, calcUserScoreMap, calcUserStatMap } from './stats/stats_user_map'

//const API_endpoint = "http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500";
const API_endpoint = "https://0lcnm5wjck.execute-api.us-east-2.amazonaws.com/Main";
//const API_endpoint = "http://ec2-3-133-113-99.us-east-2.compute.amazonaws.com:5500";

	/*
		global data for the current daily star
	*/

export type SeasonObj = {
	"canon_id": number,
	"startdate": string
};

export type GlobNorm = {
	"day": number,
	"weekly": boolean,
	"globid": string,
	"stageid": number,
	"staridlist": string,
	"special": null,
	"message": string | null
};

export type GlobSkip = {
	"day": number,
	"weekly": boolean,
	"special": "skip",
	"message": string
}

export type GlobEnd = {
	"day": null
};

export type GlobObj = GlobNorm | GlobSkip;
export type FullGlobObj = GlobObj | GlobEnd;

export type DSState = "null" | "err" | "early" | "ok" | "none" 

export type DailyStarObj = {
	"status": DSState,
	"season": SeasonObj,
	"dayOffset": number,
	"starGlob": FullGlobObj | undefined
};

export const G_DAILY: DailyStarObj = {
	"status": "null",
	"season": { "canon_id": 0, "startdate": "" },
	"dayOffset": 0,
	"starGlob": undefined
}

export async function initDailyStar(callback: () => void) {
	// load the current star
	const getReq = await fetch(API_endpoint + "/season/today");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		G_DAILY.status = "err";
		return;
	}
	console.log("Successfully loaded today's daily star.");
	var newDS = res.res as DailyStarObj;
	G_DAILY.status = newDS.status;
	G_DAILY.season = newDS.season;
	G_DAILY.dayOffset = newDS.dayOffset;
	G_DAILY.starGlob = newDS.starGlob;
	// reload page
	callback();
}

// UNSAFE_ ??

export type HistState = "null" | "err" | "none" | "active";

export type HistoryDesc = {
	"status": HistState,
	"season": SeasonObj,
	"starList": GlobObj[]
};

export type HistoryEntry = {
	"star": GlobObj,
	"times": ReadTimeObj[]
}

export type HistoryObj = {
	"header": HistoryDesc,
	"data": HistoryEntry[],
	"starMap": StxStarMap | null,
	"userMap": UserStatMap | null
};

export const G_HISTORY: HistoryObj = {
	"header": {
		"status": "null",
		"season": { "canon_id": 0, "startdate": "" },
		"starList": [] 
	},
	"data": [],
	"starMap": null,
	"userMap": null
};

const EST_OFFSET = 4 * 60 * 60 * 1000;
const DAY_OFFSET = 24 * 60 * 60 * 1000;

function daysSinceStart(startDate: string, date: Date): number {
	// midnight in EST
	var startTime = (new Date(startDate)).getTime() + EST_OFFSET;
	var cTime = date.getTime();
	return Math.floor((cTime - startTime) / DAY_OFFSET);
}

function dateWithOffset(startDate: string, day: number): string {
	var newTime = (new Date(startDate)).getTime() + (day * DAY_OFFSET);
	return new Date(newTime).toISOString().split('T')[0];
}

export function dateRawEST(startDate: string, day: number, offset: number): number {
	return (new Date(startDate).getTime()) + ((day + offset) * DAY_OFFSET) + EST_OFFSET;
}

async function loadPastStar(startDate: string, day: number, weekly: boolean,
	stageId: number, starId: string): Promise<ReadTimeObj>
{
	var date = dateWithOffset(startDate, day);
	var lk = API_endpoint + "/times/read/from_day?stage=" + stageId +
		"&star=" + starId + "&date=" + date;
	if (weekly) lk = lk + "&range=7";
	const getReq = await fetch(lk);
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	return res.res as ReadTimeObj;
}

async function loadAllStar(startDate: string, range: number): Promise<ReadAnyTimeObj>
{
	var date = dateWithOffset(startDate, 0);
	var lk = API_endpoint + "/times/read/history?&date=" + date + "&range=" + range;
	const getReq = await fetch(lk);
	var res = await getReq.json();
	console.log(res);
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	return res.res as ReadAnyTimeObj;
}

export async function initHistory(callback: () => void) {
	// load list of stars in history desc
	const getReq = await fetch(API_endpoint + "/season/all");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		G_HISTORY.header.status = "err";
		return;
	}
	var desc = res.res as HistoryDesc;
	desc.starList.sort(function (a, b) { return a.day - b.day });
	G_HISTORY.header = desc;
	console.log(G_HISTORY.header);
	// load history data in general
	var today = new Date(Date.now());
	var dayTotal = daysSinceStart(desc.season.startdate, today);
	var unsortTimes = await loadAllStar(desc.season.startdate, dayTotal + 1); 
	// go through the star list and load the times
	var data: HistoryEntry[] = [];
	for (const glob of desc.starList)
	{
		if (glob.day >= dayTotal) continue;
		if (glob.special !== null) continue;
		var starIdList = readCodeList(glob.stageid, glob.staridlist);
		var times: ReadTimeObj[] = [];
		for (const [stageId, starId] of starIdList) {
			var d1 = dateRawEST(desc.season.startdate, glob.day, 0);
			var offset = glob.weekly ? 7 : 1;
			// 300000 = 5 min leeway
			var d2 = dateRawEST(desc.season.startdate, glob.day, offset) + 300000;
			var t = unsortTimes.filter(function (a) {
				var d = new Date(a.recvtime).getTime();
				return d1 <= d && d <= d2 && a.stageid === stageId && a.starid === starId;
			});
			times.push(t);
		}
		data.push({ "star": glob, "times": times });
	}
	data.sort(function (a, b) { return a.star.day - b.star.day; });
	/*
	var data: HistoryEntry[] = [];
	var today = new Date(Date.now());
	for (const glob of desc.starList)
	{
		if (glob.day >= dayTotal) continue;
		var starIdList = glob.staridlist.split(',');
		var times: ReadTimeObj[] = [];
		var err = false;
		for (const starId of starIdList) {
			var t = await loadPastStar(desc.season.startdate, glob.day, glob.weekly, glob.stageid, starId);
			if (t.length === 0) err = true;
			times.push(t);
		}
		if (!err) data.push({ "star": glob, "times": times });
	}*/
	G_HISTORY.data = data;
	// reload page
	console.log("Successfully loaded history data.");
	callback();
}

export function mostRecentWeekly(): GlobObj | null {
	var startDate = G_HISTORY.header.season.startdate;
	var maxDay = daysSinceStart(startDate, new Date(Date.now()));
	// iterate looking for most recent (non-future) weekly
	var retGlob: GlobObj | null = null;
	var starList = G_HISTORY.header.starList;
	for (const glob of starList) {
		if (glob.weekly && glob.day <= maxDay) {
			if (retGlob === null || glob.day > retGlob.day) retGlob = glob;
		}
	}
	return retGlob;
}

	/*
		glob functionality
	*/

export function readCodeList(stageId: number, starIdList: string): [number, string][]
{
	var relIdList = starIdList.split(',');
	return relIdList.map((relId) => {
		var fullIdComp = relId.split('$');
		if (fullIdComp.length <= 1) return [stageId, relId];
		return [parseInt(fullIdComp[0]), fullIdComp[1]]; 
	});
}

	/*
		date display
	*/

const MONTH_LIST = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dateAndOffset(d: string, offset: number): Date
{
	var DAY_OFFSET = 24 * 60 * 60 * 1000;
	var dTime = new Date(d).getTime() + (offset * DAY_OFFSET);
	return new Date(dTime);
}

export function dispDate(date: Date)
{
	return MONTH_LIST[date.getUTCMonth()] + " " + date.getUTCDate();
}

	/*
		interface for obtaining history star data as a time table
	*/

export type StarLoadFun = (stageId: number, starDef: StarDef, 
	colList: ColList, verOffset: VerOffset, stratOffset: StratOffset) => TimeTable;

export function historyTimeTable(ix: number, globIx: number, starDef: StarDef,
	colList: ColList, verOffset: VerOffset, stratOffset: StratOffset): TimeTable
{
	var data = G_HISTORY.data[ix].times[globIx];
	return loadTTRaw(data, starDef, colList, verOffset, stratOffset);
}

const historyTTFun: StarLoadFun = (stageId, starDef, colList, verOffset, stratOffset) => {
	for (let i = 0; i < G_HISTORY.data.length; i++) {
		var starGlob = G_HISTORY.data[i].star;
		if (starGlob.special !== null) continue;
		var starCodeList = readCodeList(starGlob.stageid, starGlob.staridlist);
		for (let j = 0; j < starCodeList.length; j++) {
			var [globStageId, globStarCode] = starCodeList[j];
			if (stageId === globStageId && starDef.id === globStarCode) {
				return historyTimeTable(i, j, starDef, colList, verOffset, stratOffset);
			}
		}
	}
	console.log(stageId, starDef);
	throw("Attempted to collect time table for star not found in history.");
};

function historyStarSet(): [StarDef, number][][]
{
	var starSet: [StarDef, number][][] = Array(orgStageTotal()).fill(0).map(() => { return []; });
	for (let i = 0; i < G_HISTORY.data.length; i++) {
		var starGlob = G_HISTORY.data[i].star;
		if (starGlob.special !== null) continue;
		var starCodeList = readCodeList(starGlob.stageid, starGlob.staridlist);
		for (const [stageId, starCode] of starCodeList) {
			var starId = orgStarId(stageId, starCode);
			starSet[stageId].push([orgStarDef(stageId, starId), starId]);
		}
	}
	return starSet;
}

	/*
		history stat calc
	*/


export async function calcHistoryStatData(callback: () => void)
{
	var starSet = historyStarSet();
	var [starMap, scoreMap] = calcUserScoreMap(starSet, historyTTFun, true);
	var userMap = calcUserStatMap(starSet, scoreMap, false, newIdent("remote", "Nobody"));
	G_HISTORY.starMap = starMap;
	G_HISTORY.userMap = userMap;
	callback();
}