
//const API_endpoint = "http://ec2-3-129-19-199.us-east-2.compute.amazonaws.com:5500";
const API_endpoint = "https://0lcnm5wjck.execute-api.us-east-2.amazonaws.com/Main";

	/*
		loads the current star from daily star
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

export type DailyStarObj = {
	"status": string,
	"season": SeasonObj,
	"dayOffset": number,
	"starGlob": GlobObj | undefined
};

export async function loadToday(): Promise<DailyStarObj | null> {
	// load the current star
	const getReq = await fetch(API_endpoint + "/season/today");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return null;
	}
	console.log("Successfully loaded today's daily star.");
	return res.res as DailyStarObj;
}

// UNSAFE_ ??