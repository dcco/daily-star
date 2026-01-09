
// -- officially outdated
//export const API_endpoint = "http://ec2-3-14-80-190.us-east-2.compute.amazonaws.com:5500";
//export const API_endpoint = "https://0lcnm5wjck.execute-api.us-east-2.amazonaws.com/Main";

export const API_endpoint = "https://4rxry866a4.execute-api.us-east-2.amazonaws.com/Main";
//export const API_endpoint = "https://kjcjfyxwwa.execute-api.us-east-2.amazonaws.com/Main";

	/*
		glob: a collection of day information + a list of stars (the glob)
			that define a day of activity in the daily star
	*/

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

	/*
		- translates the shorthand starIdList into a complete list of stars
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
		global data for the current daily star
	*/

export type SeasonDef = {
	"canon_id": number,
	"startdate": string,
	"active"?: boolean
};

export type DSState = "null" | "err" | "early" | "ok" | "none" 

export type DailyStarObj = {
	"status": DSState,
	"season": SeasonDef,
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
	const getReq = await fetch(API_endpoint + "/seasons/current/today", {
		method: "POST",
		body: JSON.stringify({}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
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
