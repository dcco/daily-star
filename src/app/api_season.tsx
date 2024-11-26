
import { ReadObj } from './api_live'

//const API_endpoint = "http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500";
const API_endpoint = "https://0lcnm5wjck.execute-api.us-east-2.amazonaws.com/Main";
//const API_endpoint = "http://ec2-18-219-11-239.us-east-2.compute.amazonaws.com:5500";

	/*
		global data for the current daily star
	*/

export type SeasonObj = {
	"canon_id": number,
	"startdate": string
};

export type GlobObj = {
	"day": number,
	"weekly": boolean,
	"globid": string,
	"stageid": number,
	"staridlist": string
}

export type DSState = "null" | "err" | "early" | "ok" | "late" 

export type DailyStarObj = {
	"status": DSState,
	"season": SeasonObj,
	"dayOffset": number,
	"starGlob": GlobObj | undefined
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
	"times": ReadObj[][]
}

export type HistoryObj = {
	"header": HistoryDesc,
	"data": HistoryEntry[]
};

export const G_HISTORY: HistoryObj = {
	"header": {
		"status": "null",
		"season": { "canon_id": 0, "startdate": "" },
		"starList": [] 
	},
	"data": []
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
	stageId: number, starId: string): Promise<ReadObj[]>
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
	return res.res as ReadObj[];
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
	G_HISTORY.header = desc;
	// go through the star list and load the times
	var data: HistoryEntry[] = [];
	var today = new Date(Date.now());
	for (const glob of desc.starList)
	{
		if (glob.day >= daysSinceStart(desc.season.startdate, today)) continue;
		var starIdList = glob.staridlist.split(',');
		var times: ReadObj[][] = [];
		var err = false;
		for (const starId of starIdList) {
			var t = await loadPastStar(desc.season.startdate, glob.day, glob.weekly, glob.stageid, starId);
			if (t.length === 0) err = true;
			times.push(t);
		}
		if (!err) data.push({ "star": glob, "times": times });
	}
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