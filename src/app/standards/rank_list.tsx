
import { VerOffset, TimeDat, rawMS, msToFrames, framesToMS, applyVerOffsetRaw } from "../time_dat"
import { TimeTable } from "../time_table"

import { RANK_NAME_LIST, RANK_NAME_MAP, RankTimeCol, getTimeCol, skillMetricTimeCol, tallyRanksTimeCol } from "./rank_const"
import { StratRankObj, newRankObj, maxRankObj, fillAltRankObj } from "./rank_obj"

	// confidence (number of distinct time submissions) required to generate a new rank
const RANK_CONFIDENCE = 7;

	/*
		rank list: object containing a list of rank times for a given strat
	*/

export type RankMethods = "normal" | "easy" | "hard" | "rewrite" | "rescale" | "error"

export type RankList = {
	"name": string,
	"times": { [key: string]: StratRankObj },
	"skillMetric": number,
	"confidence": number,
	"rankMethod": RankMethods
};

export function zeroRankList(name: string, method: RankMethods): RankList
{
	var rankList: RankList = {
		"name": name,
		"times": {},
		"skillMetric": 0,
		"confidence": 0,
		"rankMethod": method
	}
	for (let i = 0; i < RANK_NAME_LIST.length; i++) {
		rankList.times[RANK_NAME_LIST[i][0]] = { "sr": "none" };
	}
	return rankList;
}

	/// RANK TIME CALCULATION
	// build ranks
export function genRankList(name: string, timeCol: RankTimeCol, rankPlayRate: number[], skillMetric: number): RankList
{
	var st: RankList = { "name": name, "times": {}, "skillMetric": skillMetric, "confidence": 0, "rankMethod": "normal" };
	var rankTotal = timeCol.length;
	var lastRankId = -1;
	var unusedTotal = 0;
	for (let i = 0; i < RANK_NAME_LIST.length; i++) {
		var [rankName, percent] = RANK_NAME_LIST[i];
		var curPlayRate = rankPlayRate[i];
		// we require at least X people to confidently make a new rank
		var rankObj = maxRankObj({ "m": "interpolate" });
		var nextRankId = lastRankId + unusedTotal + curPlayRate;
		var notNearEnd = nextRankId <= rankTotal * 0.9 && nextRankId + (RANK_CONFIDENCE * 2.0) < rankTotal;
		var adjConfidence = RANK_CONFIDENCE;
		if (i === 0) adjConfidence = Math.ceil(adjConfidence * 0.6);
		if ((notNearEnd || i === 0) && unusedTotal + curPlayRate >= adjConfidence) {
			rankObj = newRankObj(timeCol[nextRankId][1].time, {
				"m": "perc",
				"rankId": nextRankId,
				"total": rankTotal
			});
			lastRankId = nextRankId;
			unusedTotal = 0;
			st.confidence = st.confidence + 1;
		// otherwise use a dummy time
		} else {
			rankObj = { "sr": "none" };
			unusedTotal = unusedTotal + curPlayRate;
		}
		st.times[rankName] = rankObj;
	}
	return st;
}

export function genTTRankList(name: string, tt: TimeTable, colId: number): RankList
{
	var timeCol = getTimeCol(tt, colId);
	var skillMetric = skillMetricTimeCol(timeCol);
	var rankPlayRate = tallyRanksTimeCol(timeCol, skillMetric);
	return genRankList(name, timeCol, rankPlayRate, skillMetric);
}

	// interpolates missing times in a rank list (using distance from record)

export function interpolateRankList(rl: RankList, record: TimeDat)
{
	// for each "missing rank", gets the index of the next filled in rank
	var nextConfList = Array(RANK_NAME_LIST.length - 1).fill(-1);
	for (let i = 0; i < RANK_NAME_LIST.length - 2; i++) {
		for (let j = i; j < RANK_NAME_LIST.length - 1; j++) {
			var checkName = RANK_NAME_LIST[j][0];
			if (rl.times[checkName].sr !== "none") {
				nextConfList[i] = j;
				break;
			}
		}
	}
	// for each rank
	for (let i = 0; i < RANK_NAME_LIST.length - 1; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		// extrapolate/interpolate if rank is empty
		if (rl.times[rankName].sr !== "none") continue;
		// get "previous" (known) time to use as reference, using record if none available
		var prevTime = record.verTime;
		var prevAm = 0;
		if (i !== 0) {
			var prevRank = rl.times[RANK_NAME_LIST[i - 1][0]];
			if (prevRank.sr === "none") break;
			prevTime = prevRank.time.time;
			prevAm = 100 - RANK_NAME_LIST[i - 1][1];
		}
		// if there is no "next rank" (trailing rank)
		if (nextConfList[i] === -1) {
			// calc record time info
			var recordFrames = msToFrames(record.verTime);
			var frameDiff = msToFrames(prevTime) - recordFrames;
			if (frameDiff === 0) frameDiff = 1;
			// extrapolate using previous rank time + record
			var extraFrames = recordFrames + Math.ceil(frameDiff * (100 - RANK_NAME_LIST[i][1]) / prevAm);
			rl.times[rankName] = newRankObj(framesToMS(extraFrames), { "m": "interpolate" });
		// if there is a "next rank" (middle rank)
		} else {
			var nextConfId = nextConfList[i];
			var nextConfRank = RANK_NAME_LIST[nextConfId][0];
			var nr = rl.times[nextConfRank];
			if (nr.sr === "none") throw("BUG: rank_list.tsx - Invalid nextConfRank in use.")
			var nextConfTime = nr.time;
			// calculate relative multiplier
			var nextAm = 100 - RANK_NAME_LIST[nextConfId][1];
			var targetAm = 100 - RANK_NAME_LIST[i][1];
			var relMul = (targetAm - prevAm) / (nextAm - prevAm);
			// interpolate using previous rank + next valid rank
			var frameDiff = msToFrames(nextConfTime.time) - msToFrames(prevTime);
			var interFrames = msToFrames(prevTime) + Math.ceil(frameDiff * relMul);
			rl.times[rankName] = newRankObj(framesToMS(interFrames), { "m": "interpolate" });
		}
	}
}

/*
function interpolateStratTimes(st: RankList, colId: number, recordList: TimeDat[])
{
	var nextConfList = Array(RANK_NAME_LIST.length - 1).fill(-1);
	for (let i = 0; i < RANK_NAME_LIST.length - 2; i++) {
		for (let j = i; j < RANK_NAME_LIST.length - 1; j++) {
			var checkName = RANK_NAME_LIST[j][0];
			if (st.times[checkName].sr !== "none") {
				nextConfList[i] = j;
				break;
			}
		}
	}
	for (let i = 0; i < RANK_NAME_LIST.length - 1; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		// extrapolate/interpolate if rank is empty
		if (st.times[rankName].sr !== "none") continue;
		// get "previous" time to use as reference
		var prevTime = rl[colId].verTime;
		var prevAm = 0;
		if (i !== 0) {
			var prevRank = st.times[RANK_NAME_LIST[i - 1][0]];
			if (prevRank.sr === "none") break;
			prevTime = prevRank.time.time;
			prevAm = 100 - RANK_NAME_LIST[i - 1][1];
		}
		// if there is no "next rank" (trailing rank)
		if (nextConfList[i] === -1) {
			// calc record time info
			var recordFrames = msToFrames(rl[colId].verTime);
			var frameDiff = msToFrames(prevTime) - recordFrames;
			if (frameDiff === 0) frameDiff = 1;
			// extrapolate using previous rank time + record
			var extraFrames = recordFrames + Math.ceil(frameDiff * (100 - RANK_NAME_LIST[i][1]) / prevAm);
			st.times[rankName] = newRankObj(framesToMS(extraFrames), { "m": "interpolate" });
		// if there is a "next rank" (middle rank)
		} else {
			var nextConfId = nextConfList[i];
			var nextConfRank = RANK_NAME_LIST[nextConfId][0];
			var nr = st.times[nextConfRank];
			if (nr.sr === "none") throw("BUG: strat_ranks.tsx - Invalid nextConfRank in use.")
			var nextConfTime = nr.time;
			// calculate relative multiplier
			var nextAm = 100 - RANK_NAME_LIST[nextConfId][1];
			var targetAm = 100 - RANK_NAME_LIST[i][1];
			var relMul = (targetAm - prevAm) / (nextAm - prevAm);
			// interpolate using previous rank + next valid rank
			var frameDiff = msToFrames(nextConfTime.time) - msToFrames(prevTime);
			var interFrames = msToFrames(prevTime) + Math.ceil(frameDiff * relMul);
			st.times[rankName] = newRankObj(framesToMS(interFrames), { "m": "interpolate" });
		}
	}
}*/

	// rescales ranks if multiple strats were merged
	// -- bottom rank will be offset by difference between src + scale strat
	// -- other ranks will be scaled back up accordingly
	// MODIFIES IN-PLACE
export function rescaleRankList(source: RankList, srcRecord: TimeDat, scaleRecord: TimeDat)
{
	// get worst rank time
	var worstRank = RANK_NAME_LIST[RANK_NAME_LIST.length - 2][0];
	var worstInfo = source.times[worstRank];
	if (worstInfo.sr === "none") throw("BUG: rank_list.tsx - Attempted to descale times without full set of initial times.");
	var worstTime = worstInfo.time;
	// calculate offset ratio
	var offsetFrames = msToFrames(scaleRecord.time) - msToFrames(srcRecord.time);
	// -- if offset is very small, we dont want to adjust very much
	offsetFrames = Math.max(0, offsetFrames - 6); 
	if (offsetFrames === 0) return;
	var worstTimeFrames = msToFrames(worstTime.time);
	var offsetTimeFrames = worstTimeFrames - offsetFrames;
	var recordTimeFrames = msToFrames(srcRecord.time);
	var offRatio = (recordTimeFrames - offsetTimeFrames) / (recordTimeFrames - worstTimeFrames);
	// create new strat times
	for (let i = 0; i < RANK_NAME_LIST.length - 1; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		var st = source.times[rankName];
		if (st.sr === "none") throw("BUG: rank_list.tsx - Attempted to descale times without full set of initial times.");
		var timeDiff = msToFrames(st.time.time) - recordTimeFrames;
		var newTime = framesToMS(recordTimeFrames + Math.ceil(offRatio * timeDiff));
		source.times[rankName] = newRankObj(newTime, st.method); //adjustTimeDat(newTime, st.time);
	}
}

	// rescales ranks, but with the goal of matching a target bronze time
export function rescaleRankListBack(source: RankList, srcRecord: TimeDat, bronzeTime: number, baseRank: string | null)
{
	// check src bronze time
	var bronzeIndex = RANK_NAME_LIST.length - 2;
	var bronzeRank = RANK_NAME_LIST[bronzeIndex][0];
	var srcBronzeTime = source.times[bronzeRank];
	if (srcBronzeTime.sr === "none") throw("BUG: rank_list.tsx - Attempted to manually descale without bronze rank time.");
	// obtain base rank time
	var baseTime = srcRecord.time;
	if (baseRank !== null) {
		var findTime = source.times[baseRank];
		if (findTime.sr === "none") throw("BUG: rank_list.tsx - Attempted to manually descale without desired rank time " + baseRank + ".");
		baseTime = findTime.time.time;
	}
	var baseFrames = msToFrames(baseTime);
	// calculate offset ratio
	var srcFramesDiff = baseFrames - msToFrames(srcBronzeTime.time.time);
	var tarFramesDiff = baseFrames - msToFrames(bronzeTime);
	var offRatio = tarFramesDiff / srcFramesDiff;
	// create new strat times
	var foundBase = false;
	for (let i = 0; i < RANK_NAME_LIST.length - 1; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		// wait until we've found the base rank (if applicable)
		if (baseRank === null || foundBase || rankName === baseRank) foundBase = true;
		else continue;
		var st = source.times[rankName];
		if (st.sr === "none") throw("BUG: rank_list.tsx - Attempted to manually descale without full set of initial times.");
		var timeDiff = msToFrames(st.time.time) - baseFrames;
		var newTime = framesToMS(baseFrames + Math.ceil(offRatio * timeDiff));
		source.times[rankName] = newRankObj(newTime, st.method);
	}
}

	// rewrites a TARGET rank list using a SOURCE rank list as a benchmark
	// -- can also rescale in cases where two strats were merged
export function rewriteRankList(source: RankList, target: RankList,
	srcRecord: TimeDat, tarRecord: TimeDat, rankMethod: RankMethods): RankList
{
	// initialize new set of TARGET rank times
	var st: RankList = {
		"name": target.name,
		"times": {},
		"skillMetric": target.skillMetric,
		"confidence": 0,
		"rankMethod": rankMethod
	};
	// initialize TARGET rank times using SOURCE rank times
	for (let i = 0; i < RANK_NAME_LIST.length; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		// find SOURCE rank time
		if (source.times[rankName] === undefined) continue;
		var srcTime = source.times[rankName];
		if (srcTime.sr === "none") {
			st.times[rankName] = { "sr": "none" };
			continue;
		}
		// calculate TARGET time based on SOURCE time
		var srcDiff = msToFrames(srcTime.time.time) - msToFrames(srcRecord.verTime);
		var tarTime = framesToMS(msToFrames(tarRecord.verTime) + srcDiff);
		// if old ranking is simply being re-scaled, maintain percentiles
		var srcMethod = srcTime.method;
		if (rankMethod === "rescale") {
			//var newInfo = copyRankObj(srcTime);
			//if (newInfo.sr !== "none") newInfo.time = newRankDat(tarTime); 
			//st.times[rankName] = newInfo;
			st.times[rankName] = newRankObj(tarTime, srcMethod);
		} else {
			st.times[rankName] = newRankObj(tarTime, { "m": "interpolate" });
		}
	}
	return st;
}

	// fills in the version offset for a rank list
export function fillVerOffsetRankList(source: RankList, stratName: string, vs: VerOffset)
{
	for (let i = 0; i < RANK_NAME_LIST.length; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		if (source.times[rankName] === undefined) continue;
		var rankObj = source.times[rankName];
		if (rankObj.sr === "none") continue;
		var newTime = applyVerOffsetRaw(stratName, rankObj.time.time, vs);
		if (newTime !== null && vs.focusVer !== null) fillAltRankObj(rankObj, [newTime, vs.focusVer]);
		//rankInfo.time.alt = [newTime, vs.focusVer];
	}
}

	// if a scale record is given, re-scale all SOURCE rank times relative to it
	/*for (let i = 0; i < RANK_NAME_LIST.length; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		if (source.times[rankName] === undefined) continue;
		var srcTime = source.times[rankName];
	*/

	/*
		rank-time map: a mapping of ranks to times
		- used for example, to force specific ranks to match certain times
	*/

export type RankTimeMap = {
	[key: string]: string
}

export function forceTimesRankList(rl: RankList, fMap: RankTimeMap | undefined)
{
	if (fMap === undefined) return;
	//var sMap = fm[stratName];
	//if (sMap === undefined) return;
	//var recTime = rl[colId];
	for (const entry of Object.entries(fMap)) {
		var [rankName, timeText] = entry;
		var time = rawMS(timeText);
		if (time == null) throw("BUG: rank_list.tsx - Attempt to force rank time using invalid time text `" + timeText + "`.");
		rl.times[rankName] = newRankObj(time, { "m": "force" }); // recTime.rowDef
	}
}

/*
export function forceStratTimes(rl: RankList, fm: ForceMap, stratName: string, colId: number, rl: TimeDat[])
{
	var sMap = fm[stratName];
	if (sMap === undefined) return;
	var recTime = rl[colId];
	for (const entry of Object.entries(sMap)) {
		var [rankName, timeText] = entry;
		var time = rawMS(timeText);
		if (time == null) throw("BUG: strat_ranks.tsx - Invalid time text `" + timeText + "` in rank_struct.json");
		st.times[rankName] = newRankObj(time, { "m": "force" }); // recTime.rowDef
	}
}
*/