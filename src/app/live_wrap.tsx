
import { Ver, serialVarList, unserialVarList } from './variant_def'
import { newRowDef } from './row_def'
import { TimeDat, VerOffset, newTimeDat, applyVerOffset } from './time_dat'
import { ColList, toSetColList } from './org_strat_def'
import { FilterState, orgStarDef } from './org_star_def'
import { AuthIdent, TimeTable, TimeMap, newIdent,
	addTimeMap, buildTimeTable } from './time_table'
import { NickMap } from './play_data'

	/*
		xcam time API functions
	*/

type ReadObj = {
	"p_id": number,
	"time": number,
	"stratname": string,
	"ver": Ver,
	"variants": string,
	"link": string,
	"note": string
};

export async function loadTimeTable(stageId: number, _starId: number,
	colList: ColList, fs: FilterState, verOffset: VerOffset): Promise<TimeTable> {
	// load rows
	var starDef = orgStarDef(stageId, _starId);
	var starId = starDef.id;
	const getReq = await fetch("http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500/times/read?stage=" +
		stageId + "&star=" + starId);
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	// enumerate strats
	//var colList = orgColList(stageId, starId, verState);
	var [stratSet, indexSet] = toSetColList(colList);
	// build time table
	const timeMap: TimeMap = {};
	for (const _data of res.res) {
		var data = _data as ReadObj;
		var playerId = newIdent("remote", "" + data.p_id);
		//var stratDef = stratSet[data.stratname as string];
		//if (stratDef === undefined) continue;
		var stratId = indexSet[data.stratname as string];
		if (stratId === undefined) continue;
		// get row definition (if not in xcam sheet, use beginner template)
		var variants: string[] = [];
		if (starDef.variants) variants = starDef.variants;
		var vList = unserialVarList(variants, data.variants);
		var rowDef = newRowDef(data.stratname, "na", data.ver, vList);
		/*var rowDef = begRowDef(stratDef.name);
		if (stratDef.virtId === null) {
			rowDef = readRefMap(stratDef.row_map, xcamRef, stratDef.name);	
		}*/
		// add time data
		var timeDat = newTimeDat(data.time, data.link, data.note, rowDef);
		applyVerOffset(timeDat, verOffset);
		addTimeMap(timeMap, playerId, stratId, timeDat);
	}
	console.log("Successfully loaded live table data.");
	return buildTimeTable(timeMap, colList.length);
}

type SubmitObj = {
	"stageId": number,
	"starId": string,
	"stratName": string,
	"ver": Ver,
	"variantStr": string
	"time": number,
	"submitTime": number,
	"link": string,
	"note": string
}

export function postNewTimes(stageId: number, starId: number, userId: AuthIdent, timeList: TimeDat[]) {
	// initial star info
	var starDef = orgStarDef(stageId, starId);
	var variants: string[] = [];
	if (starDef.variants) variants = starDef.variants;
	// get list of times to submit
	var submitList: SubmitObj[] = [];
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
			"time": timeDat.time,
			"submitTime": Date.now(),
			"link": link,
			"note": note
		});
	}
	// send a post request
	fetch("http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500/times/submit", {
		method: "POST",
		body: JSON.stringify({
			"player": userId,
			"submitList": submitList
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}

	/*
		player data	API functions	
	*/

type NickObj = {
	"p_id": number,
	"nick": string | null
};

export async function loadNickMap(): Promise<NickMap> {
	// load nick name table
	const getReq = await fetch("http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500/players/get_nick_all");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return {};
	}
	// build nick map
	var nickMap: NickMap = {};
	for (const _data of res.res) {
		var data = _data as NickObj;
		if (data.nick !== null) nickMap["remote@" + data.p_id] = data.nick;
	}
	console.log("Successfully loaded nickname data.");
	return nickMap;
}

export async function loadUserId(userId: AuthIdent): Promise<string | null> {
	const getReq = await fetch("http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500/players/get_id?player=" +
		userId.name);
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return null;
	}
	return "" + res.res;
}

export function postNick(userId: AuthIdent, nick: string) {
	// send a post request
	fetch("http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500/players/set_nick", {
		method: "POST",
		body: JSON.stringify({
			"player": userId,
			"nick": nick
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}

//function postNewTimes(stageId, starId, name, diffText, colOrder) {
	/*var stratSet = Object.entries(orgData[stageId].starList[starId].jp_set);
	var stratList = stratSet.map((strat, i) => {
		const [stratName, stratDef] = strat;
		return stratName;
	});*/

	// get columns / variant indices
	//var colList = orgColList(stageId, starId);
	//var variantList = orgVariantList(colList, variant);
	// get list of times to submit
/*	var submitList = [];
	for (let i = 0; i < diffText.length; i++) {
		if (diffText[i] !== null) {
			var time = rawMS(diffText[i]);
			//var stratId = variantList[i];
			submitList.push({
				"player": name,
				"stageId": stageId,
				"starId": starId,
				"stratName": colOrder[i][1].name, //colList[stratId].name,
				"time": time,
				"submitTime": Date.now()
			})
		}
	}
	// send a post request
	fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5500/times/submit", {
		method: "POST",
		body: JSON.stringify(submitList),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}*/