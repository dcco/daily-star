
//const API_endpoint = "http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500";
const API_endpoint = "https://0lcnm5wjck.execute-api.us-east-2.amazonaws.com/Main";
//const API_endpoint = "http://ec2-18-217-150-208.us-east-2.compute.amazonaws.com:5500";

	/*
		global data for the current daily star
	*/

export type SeasonObj = {
	"canon_id": number,
	"startdate": string
};

export type GlobObj = {
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