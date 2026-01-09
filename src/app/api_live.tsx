
import { serialVarList, unserialVarList } from './variant_def'
import { newRowDef } from './row_def'
import { TimeDat, VerOffset, StratOffset, newTimeDat, applyVerOffset, applyStratOffset } from './time_dat'
import { ColList, toSetColList } from './org_strat_def'
import { StarDef, FilterState, orgStarDef } from './org_star_def'
import { AuthIdent, TimeTable, TimeMap, newIdent,
	addTimeMap, buildTimeTable } from './time_table'
import { PlayDatMap } from './play_data'
import { ReadTimeObj, SubmitTimeUnit, SubmitTimeObj, ReadNickObj, SubmitNickObj } from './api_types'
import { dateAndOffset } from './api_history'

// -- officially outdated
//const API_endpoint = "http://ec2-3-14-80-190.us-east-2.compute.amazonaws.com:5500";
//const API_endpoint = "https://0lcnm5wjck.execute-api.us-east-2.amazonaws.com/Main";

const API_endpoint = "https://4rxry866a4.execute-api.us-east-2.amazonaws.com/Main";
//const API_endpoint = "https://kjcjfyxwwa.execute-api.us-east-2.amazonaws.com/Main";

	/*
		xcam time API functions
	*/

//export function loadTTRaw(rawData: ReadTimeObj, starDef: StarDef,
export function readObjTimeTable(rawData: ReadTimeObj, starDef: StarDef,
	colList: ColList, verOffset: VerOffset, stratOffset: StratOffset): TimeTable
{
	// enumerate strats
	var [stratSet, indexSet] = toSetColList(colList);
	// build time table
	const timeMap: TimeMap = {};
	for (const data of rawData) {
		var playerId = newIdent("remote", "" + data.p_id);
		var stratId = indexSet[data.stratname as string];
		var stratDef = stratSet[data.stratname as string];
		if (stratId === undefined) continue;
		// get row definition (if not in xcam sheet, use beginner template)
		var variants: string[] = [];
		if (starDef.variants) variants = starDef.variants;
		var vList = unserialVarList(variants, data.variants);
		var rowDef = newRowDef(data.stratname, "na", data.ver, vList);
		// add time data
		var verifFlag = data.verifflag;
		if (verifFlag === null) verifFlag = 'no';
		var timeDat = newTimeDat(data.time, data.link, data.note, verifFlag, rowDef);
		timeDat.origin = data.submit_id;
		applyVerOffset(timeDat, verOffset);
		applyStratOffset(timeDat, stratDef.diff.includes("second"), stratOffset);
		addTimeMap(timeMap, playerId, stratId, timeDat);
	}
	return buildTimeTable(timeMap, colList.length);
}

export type TTLoadType = ["today"] | ["week", string] | ["all"];

export function getLoadType(startDate: string, day: number, weekly: boolean): TTLoadType
{
	if (!weekly) return ["today"];
	var rawDate = dateAndOffset(startDate, day);
	return ["week", rawDate.toISOString().split('T')[0]];
}

export async function loadTimes(stageId: number, starDef: StarDef, today: TTLoadType): Promise<ReadTimeObj>
{
	var starId = starDef.id;
	// api request - load rows
	var lk = "/times/read?stage=" + stageId + "&star=" + starId;
	if (today[0] === "today") lk = "/times?date=today&stage=" + stageId + "&star=" + starId;
	else if (today[0] === "week") lk = "/times?stage=" + stageId +
		"&star=" + starId + "&date=" + today[1] + "&range=" + 7;
	const getReq = await fetch(API_endpoint + lk);
	// check response
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	return res.res as ReadTimeObj;	
}

/*
export async function loadTimeTable(stageId: number, starDef: StarDef, today: TTLoadType,
	colList: ColList, fs: FilterState, verOffset: VerOffset, stratOffset: StratOffset): Promise<TimeTable>
{
	var starId = starDef.id;
	// api request - load rows
	var lk = "/times/read?stage=" + stageId + "&star=" + starId;
	if (today[0] === "today") lk = "/times?date=today&stage=" + stageId + "&star=" + starId;
	else if (today[0] === "week") lk = "/times?stage=" + stageId +
		"&star=" + starId + "&date=" + today[1] + "&range=" + 7;
	const getReq = await fetch(API_endpoint + lk);
	// check response
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	// compile into time table
	var tt = loadTTRaw(res.res as ReadTimeObj, starDef, colList, verOffset, stratOffset);
	console.log("Successfully loaded live table data.");
	return tt;
}*/

export function postNewTimes(stageId: number, starDef: StarDef,
	myId: AuthIdent, userId: AuthIdent, nick: string | null, timeList: TimeDat[], delList: TimeDat[], verifList: TimeDat[])
{
	// initial star info
	var variants: string[] = [];
	if (starDef.variants) variants = starDef.variants;
	// get list of times to submit
	var submitList: SubmitTimeUnit[] = [];
	for (const timeDat of timeList) {
		var link = "";
		var note = "";
		if (timeDat.link !== null) link = timeDat.link;
		if (timeDat.note !== null) note = timeDat.note;
		submitList.push({
			"stageId": stageId,
			"starId": starDef.id,
			"stratName": timeDat.rowDef.name,
			"ver": timeDat.rowDef.ver,
			"variantStr": serialVarList(variants, timeDat.rowDef.variant_list),
			"time": timeDat.rawTime,
			"submitTime": Date.now(),
			"link": link,
			"note": note
		});
	}
	var delIdList: number[] = delList.map((dat) => dat.origin).filter((dat) => dat !== null);
	var verifSetList: [number, string][] = [];
	verifList.map((dat) => { if (dat.origin !== null) verifSetList.push([dat.origin, dat.verifFlag === null ? 'maybe' : dat.verifFlag]); });
	// api request - submit times
	var submitObj: SubmitTimeObj = {
		"player": userId,
		"nick": nick,
		"accessToken": myId.token.accessToken,
		"submitList": submitList,
		"delList": delIdList,
		"verifList": verifSetList
	};
	fetch(API_endpoint + "/times", {
		method: "POST",
		body: JSON.stringify(submitObj),
		headers: { "Content-type": "application/json; charset=UTF-8" }
	});
}

	/*
		player data	API functions	
	*/

export async function loadNickMap(): Promise<PlayDatMap> {
	// api request - load nick name table
	const getReq = await fetch(API_endpoint + "/players/nicks");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return {};
	}
	// build nick map
	var nickMap: PlayDatMap = {};
	var nickList = res.res as ReadNickObj;
	for (const data of nickList) {
		if (data.nick !== null) nickMap["remote@" + data.p_id] = {
			"nick": data.nick,
			"perm": data.perm
		};
	}
	console.log("Successfully loaded nickname data.");
	return nickMap;
}

export async function loadUserId(userId: AuthIdent): Promise<string | null> {
	// api request - load id associated with player account
	var accessToken = "";
	if (userId.token) accessToken = userId.token.accessToken;
	const getReq = await fetch(API_endpoint + "/players/me?player=" + userId.name, {
		"headers": { "authorization": accessToken }
	});
	// check response
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return null;
	}
	return "" + res.res;
}

export function postNick(userId: AuthIdent, nick: string) {
	// api request - submit new nickname
	var submitObj: SubmitNickObj = {
		"player": userId,
		"accessToken": userId.token.accessToken,
		"nick": nick
	};
	fetch(API_endpoint + "/players/nicks", {
		method: "POST",
		body: JSON.stringify(submitObj),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}
