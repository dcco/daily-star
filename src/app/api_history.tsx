
import { ReadTimeObj, ReadAnyTimeObj } from './api_types'
import { readObjTimeTable } from './api_live'
import { API_endpoint, GlobObj, SeasonDef, readCodeList } from './api_season'

import { VerOffset, StratOffset } from './time_dat'
import { TimeTable, newIdent } from './time_table'
import { ColList } from './org_strat_def'
import { StarDef, orgStageTotal, orgStarId, orgStarDef } from './org_star_def'

/*import { StxStarMap } from './stats/stats_star_map'
import { UserScoreMap, UserStatMap, calcUserScoreMap, calcUserStatMap } from './stats/stats_user_map'
*/
import { ScoreCache, initScoreCache } from './stats/score_cache'

	/*
		history for individual season
	*/

export type HistState = "null" | "err" | "none" | "active";

export type SeasonObj = {
	"status": HistState,
	"season": SeasonDef,
	"starList": GlobObj[]
};

export type SeasonEntry = {
	"star": GlobObj,
	"times": ReadTimeObj[]
}

export type SeasonHistory = {
	"header": SeasonObj,
	"data": SeasonEntry[],
	"scoreData": ScoreCache | null
	//"starMap": StxStarMap | null,
	//"userMap": UserStatMap | null
};

function emptySeasonHistory(): SeasonHistory
{
	return {
		"header": {
			"status": "null",
			"season": { "canon_id": 0, "startdate": "" },
			"starList": [] 
		},
		"data": [],
		"scoreData": null
	};
}

	/*
		history for all seasons
	*/

/*export const G_HISTORY: SeasonHistory = {
	"header": {
		"status": "null",
		"season": { "canon_id": 0, "startdate": "" },
		"starList": [] 
	},
	"data": [],
	"starMap": null,
	"userMap": null
};*/

export type HistoryObj = {
	"current": SeasonHistory,
	"pastList": SeasonHistory[]
}

export const G_HISTORY: HistoryObj = {
	"current": emptySeasonHistory(),
	"pastList": []
};

export function findSeason(id: number): SeasonHistory | null
{
	for (const season of G_HISTORY.pastList) {
		if (season.header.season.canon_id === id) return season;
	}
	return null;
}

	// exists because season 3 largely doesn't have videos 
export function noVerifSeason(id: number | null): boolean {
	return id !== null && id <= 3;
}

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
	var lk = API_endpoint + "/times?stage=" + stageId + "&star=" + starId + "&date=" + date;
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
	var lk = API_endpoint + "/times?date=" + date + "&range=" + range;
	const getReq = await fetch(lk);
	var res = await getReq.json();
	console.log(res);
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	return res.res as ReadAnyTimeObj;
}

async function initSeasonHistory(hist: SeasonHistory, canonId: number | null)
{
	// load RAW list of stars in history desc
	var seasonPath = "current";
	if (canonId !== null) seasonPath = "" + canonId;
	const getReq = await fetch(API_endpoint + "/seasons/" + seasonPath);
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		hist.header.status = "err";
		return;
	}
	// initialize season header (list of stars)
	var desc = res.res as SeasonObj;
	desc.starList.sort(function (a, b) { return a.day - b.day });
	hist.header = desc;
	// filter "future" stars
	var today = new Date(Date.now());
	var dayTotal = daysSinceStart(desc.season.startdate, today);
	desc.starList = desc.starList.filter((a) => a.day <= dayTotal);
	// load history data in general
	var unsortTimes = await loadAllStar(desc.season.startdate, dayTotal + 1);
	// go through the star list and load the times
	var data: SeasonEntry[] = [];
	for (const glob of desc.starList)
	{
		if (glob.day >= dayTotal + 1) continue;
		if (glob.special !== null) {
			data.push({ "star": glob, "times": [] });
			continue;
		}
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
	hist.data = data;
}

export async function initCurrentHistory(callback: () => void) {
	// init current obj + reload page
	await initSeasonHistory(G_HISTORY.current, null);
	console.log("Successfully loaded history data (current season).");
	callback();
}

function findStarSeasonHistory(hist: SeasonHistory, stageId: number, starDef: StarDef): [number, number] | null
{
	for (let i = 0; i < hist.data.length; i++) {
		const entry = hist.data[i];
		const globObj = entry.star;
		if (globObj.special !== null) continue;
		const tarList = readCodeList(globObj.stageid, globObj.staridlist);
		for (let j = 0; j < tarList.length; j++) {
			const [tarStageId, tarStarId] = tarList[j]
			if (tarStageId === stageId && tarStarId === starDef.id) return [i, j];
		}
	}
	return null;
}

export async function updateCurrentHistory(stageId: number, starDef: StarDef, timeObj: ReadTimeObj)
{
	const res = findStarSeasonHistory(G_HISTORY.current, stageId, starDef);
	if (res === null) return;
	const [dayIndex, globIndex] = res;
	G_HISTORY.current.data[dayIndex].times[globIndex] = timeObj;
	calcHistoryStatData(G_HISTORY.current, null, () => {});
}

/*export async function initCurrentHistory(callback: () => void) {
	// load list of stars in history desc
	const getReq = await fetch(API_endpoint + "/seasons/current");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		G_HISTORY.current.header.status = "err";
		return;
	}
	var desc = res.res as SeasonObj;
	desc.starList.sort(function (a, b) { return a.day - b.day });
	G_HISTORY.current.header = desc;
	//console.log(G_HISTORY.current.header);
	// load history data in general
	var today = new Date(Date.now());
	var dayTotal = daysSinceStart(desc.season.startdate, today);
	var unsortTimes = await loadAllStar(desc.season.startdate, dayTotal + 1); 
	// go through the star list and load the times
	var data: SeasonEntry[] = [];
	for (const glob of desc.starList)
	{
		if (glob.day >= dayTotal) continue;
		if (glob.special !== null) {
			data.push({ "star": glob, "times": [] });
			continue;
		}
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
	G_HISTORY.current.data = data;
	// reload page
	console.log("Successfully loaded history data (current season).");
	callback();
}*/

export async function initPastHistory(callback: () => void) {
	// load list of stars in history desc
	const getReq = await fetch(API_endpoint + "/seasons");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		console.error("Failed to load past season history.");
		return;
	}
	var pastSeasonList = res.res.seasonList as SeasonDef[];
	// only load inactive seasons
	console.log(pastSeasonList);
	pastSeasonList = pastSeasonList.filter((season) => {
		return season.active === false;
	})
	// for each season, load a history object
	var newPastList: SeasonHistory[] = [];
	for (let i = 0; i < pastSeasonList.length; i++) {
		const season = pastSeasonList[i];
		const hist = emptySeasonHistory();
		await initSeasonHistory(hist, season.canon_id);
		newPastList.push(hist);
	}
	newPastList = newPastList.sort(function (a, b) {
		return a.header.season.canon_id - b.header.season.canon_id
	});
	G_HISTORY.pastList = newPastList;
	console.log("Successfully loaded history data (past seasons).");
	// initialize stats
	for (const pastSeason of G_HISTORY.pastList) {
		await calcHistoryStatData(pastSeason, pastSeason.header.season.canon_id, () => {});
	}
	console.log("Calculated stats for past seasons.");
	// reload page
	callback();
}

function getHistObj(id: number | null): SeasonHistory
{
	var histObj = G_HISTORY.current;
	if (id !== null) {
		var fObj = findSeason(id);
		if (fObj !== null) histObj = fObj;
	}
	return histObj;
}

export function mostRecentWeekly(id: number | null): GlobObj | null {
	const histObj = getHistObj(id);
	var startDate = histObj.header.season.startdate;
	var maxDay = daysSinceStart(startDate, new Date(Date.now()));
	// iterate looking for most recent (non-future) weekly
	var retGlob: GlobObj | null = null;
	var starList = histObj.header.starList;
	for (const glob of starList) {
		if (glob.weekly && glob.day <= maxDay) {
			if (retGlob === null || glob.day > retGlob.day) retGlob = glob;
		}
	}
	return retGlob;
}

export function getLastDay(id: number | null): number {
	const histObj = getHistObj(id);
	var lastDay = 0;
	var starList = histObj.header.starList;
	for (const glob of starList) {
		var n = glob.day;
		if (glob.weekly) n = n + 6;
		if (n > lastDay) lastDay = n;
	}
	return lastDay;
}

export function getMonthStars(histObj: SeasonHistory, month: number): GlobObj[] {
	var filterList = histObj.data.filter((entry) =>
		entry.star.day >= month * 28 && entry.star.day < (month + 1) * 28);
	return filterList.map((entry) => entry.star);
}

export function getWeekStars(histObj: SeasonHistory, week: number): GlobObj[] {
	var filterList = histObj.data.filter((entry) =>
		entry.star.day >= week * 7 && entry.star.day < (week + 1) * 7);
	return filterList.map((entry) => entry.star);
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

export function historyTimeTable(histObj: SeasonHistory, ix: number, globIx: number, starDef: StarDef,
	colList: ColList, verOffset: VerOffset, stratOffset: StratOffset): TimeTable
{
	var data = histObj.data[ix].times[globIx];
	return readObjTimeTable(data, starDef, colList, verOffset, stratOffset);
}

function historyTTFun(histObj: SeasonHistory): StarLoadFun {
	return function (stageId, starDef, colList, verOffset, stratOffset) {
		for (let i = 0; i < histObj.data.length; i++) {
			var starGlob = histObj.data[i].star;
			if (starGlob.special !== null) continue;
			var starCodeList = readCodeList(starGlob.stageid, starGlob.staridlist);
			for (let j = 0; j < starCodeList.length; j++) {
				var [globStageId, globStarCode] = starCodeList[j];
				if (stageId === globStageId && starDef.id === globStarCode) {
					return historyTimeTable(histObj, i, j, starDef, colList, verOffset, stratOffset);
				}
			}
		}
		console.log(stageId, starDef);
		throw("Attempted to collect time table for star not found in history.");
	}
};

function historyStarSet(id: number | null): StarDef[] //[StarDef, number][][]
{
	const histObj = getHistObj(id);
	//var starSet: [StarDef, number][][] = Array(orgStageTotal()).fill(0).map(() => { return []; });
	var starSet: StarDef[] = []
	for (let i = 0; i < histObj.data.length; i++) {
		var starGlob = histObj.data[i].star;
		if (starGlob.special !== null) continue;
		var starCodeList = readCodeList(starGlob.stageid, starGlob.staridlist);
		for (const [stageId, starCode] of starCodeList) {
			var starId = orgStarId(stageId, starCode);
			//starSet[stageId].push([orgStarDef(stageId, starId), starId]);
			starSet.push(orgStarDef(stageId, starId));
		}
	}
	return starSet;
}

	/*
		history stat calc
	*/

export async function calcHistoryStatData(histObj: SeasonHistory, id: number | null, callback: () => void)
{
	var starSet = historyStarSet(id);
	histObj.scoreData = initScoreCache(starSet, historyTTFun(histObj), true);
	/*var [starMap, scoreMap] = calcUserScoreMap(starSet, historyTTFun(histObj), true);
	var userMap = calcUserStatMap(starSet, scoreMap, false, newIdent("remote", "Nobody"), false);
	G_HISTORY.current.starMap = starMap;
	G_HISTORY.current.userMap = userMap;*/

	callback();
}
