
import { VerF, vtagVarList } from './variant_def'
import { RowDef } from './row_def'

	/*
		functions for reading time in MS
	*/

export function formatTime(time: number): string {
	var ms = time % 100;
	var sec = Math.floor(time / 100) % 60;
	var min = Math.floor(time / 6000);
	if (sec === 0 && min === 0) return "0." + ms;
	else if (min === 0) return sec + "." + ms.toString().padStart(2, '0');
	return min + ":" + sec.toString().padStart(2, '0') + "." + ms.toString().padStart(2, '0');
}

function _secMS(secText: string): number {
	if (!secText.includes('.')) return parseInt(secText) * 100;
	var ft = secText.split('.');
	if (ft[1].length === 1) ft[1] = ft[1] + '0';
	return (parseInt(ft[0]) * 100) + parseInt(ft[1]);
}

export function rawMS(fillText: string): number | null {
	if (!fillText) return null;
	try {
		// does not need to include special fixes from xcam sheet
		if (!fillText.includes(':')) return _secMS(fillText);
		var ft = fillText.split(':');
		var min = parseInt(ft[0]);
		var sec = _secMS(ft[1]);
		return (min * 6000) + sec;
	} catch (err) {
		return null;
	}
}

export function rawMSFull(text: string): number | null {
	var ft = text.split('-');
	if (ft.length >= 2) {
		var n = rawMS(ft[1]);
		if (n === null) return null;
		return -n;
	}
	return rawMS(ft[0]);
}

	/*
		functions for doing math in "frames"
	*/

export function msToFrames(ms: number): number {
	var dFrames = Math.floor(ms / 10) * 3;
	var hs = ms % 10;
	var hFrames = 0;
	if (hs >= 3 && hs < 6) hFrames = 1;
	else if (hs >= 6) hFrames = 2;
	return dFrames + hFrames; 
}

export function framesToMS(frames: number): number {
	// absolute value frames
	var neg = frames < 0;
	frames = Math.abs(frames);
	// calc each section
	var ts = Math.floor(frames / 3) * 10;
	var triMS = frames % 3;
	var hs = 0;
	if (triMS === 1) hs = 3;
	else if (triMS === 2) hs = 6;
	// final number
	var fs = ts + hs;
	if (neg) fs = -fs;
	return fs;
}

export function addFrames(frames: number, ms: number): number {
	return framesToMS(frames + msToFrames(ms));
}

export function subFrames(frames: number, ms: number): number {
	return framesToMS(msToFrames(ms) - frames);
}

export function formatFrames(frames: number): string {
	// absolute value frames
	var neg = frames < 0;
	frames = Math.abs(frames);
	// calc each section
	var triFrames = Math.floor(frames / 3);
	var triMS = frames % 3;
	var sec = Math.floor(triFrames / 10);
	var tSec = Math.floor(triFrames % 10);
	var hSec = 0;
	if (triMS === 1) hSec = 3;
	else if (triMS === 2) hSec = 6;
	// final string
	var fs = "" + sec + "." + tSec + hSec;
	if (neg) fs = "-" + fs;
	return fs;
}

	/*
		time_dat:
		* rawTime: int - unadjusted time
		* verTime: int - partially adjusted time (only includes version adjustments)
		* time: int - adjusted time
		* adjustList: string[] - list of adjustments made from the raw time
		* link: string | null
		* note: string | null
		* verifFlag : string | null -
			> null : verification is irrelevant
			> 'yes' | 'maybe' | 'no' : are the main possibilities.
				most cells are marked "maybe" to indicate that they are assumed valid, but un-confirmed
		* rowDef: row_def - xcam row represented by the time cell
		* origin: number | null - unique submission identifier (used for deletion)
	*/

export type TimeDat = {
	"rawTime": number,
	"verTime": number,
	"time": number,
	"adjustList": string[],
	"link": string | null,
	"note": string | null,
	"verifFlag": string | null,
	"recvTime": string | null,
	"rowDef": RowDef,
	"origin": number | null
}

export function newTimeDat(time: number, link: string | null, note: string | null, recvTime: string | null, verifFlag: string | null, rowDef: RowDef): TimeDat
{
	if (link === undefined || link === "") link = null;
	if (note === undefined || note === "") note = null;
	if (rowDef === undefined) throw("New time datum created with incomplete arguments.")
	return {
		"rawTime": time,
		"verTime": time,
		"time": time,
		"adjustList": [],
		"link": link,
		"note": note,
		"recvTime": recvTime,
		"verifFlag": verifFlag,
		"rowDef": rowDef,
		"origin": null
	};
}

export function adjustTimeDat(time: number, source: TimeDat): TimeDat
{
	var timeFrames = msToFrames(time);
	return {
		"rawTime": framesToMS(timeFrames + (msToFrames(source.rawTime) - msToFrames(source.time))),
		"verTime": framesToMS(timeFrames + (msToFrames(source.verTime) - msToFrames(source.time))),
		"time": time,
		"adjustList": source.adjustList.map((a) => a),
		"link": null,
		"note": null,
		"recvTime": null,
		"verifFlag": null,
		"rowDef": source.rowDef,
		"origin": null
	}
}

export function copyTimeDat(source: TimeDat): TimeDat
{
	return adjustTimeDat(source.time, source);
}

export function resetTimeDat(source: TimeDat): TimeDat
{
	return {
		"rawTime": source.rawTime,
		"verTime": source.rawTime,
		"time": source.rawTime,
		"adjustList": [],
		"link": null,
		"note": null,
		"recvTime": null,
		"verifFlag": null,
		"rowDef": source.rowDef,
		"origin": null
	}
}

export function maxTimeDat(rowDef: RowDef): TimeDat
{
	return newTimeDat(999900, null, null, null, null, rowDef);
}

export function formatTimeDat(timeDat: TimeDat): string {
	if (timeDat === null) return "";
	return formatTime(timeDat.time);
}

export function vtagTimeDat(timeDat: TimeDat): string {
	var rowDef = timeDat.rowDef;
	/*var vx = "";
	if (rowDef.variant_list.length !== 0) {
		var vList = rowDef.variant_list.filter((v) => v[0] !== -1).map((v) => v[0]);
		vList.sort();
		vx = "#" + vList.map((i) => "" + i).join('_');
	}*/
	return rowDef.name + "_" + rowDef.ver + vtagVarList(rowDef.variant_list);
}

export function recvTimeDat(timeDat: TimeDat): number {
	if (timeDat.recvTime === null || timeDat.recvTime === "") return 0;
	return new Date(timeDat.recvTime).getTime();
}

export function earlierTimeDat(t1: TimeDat, t2: TimeDat): number {
	if (t2.recvTime === null || t2.recvTime === "") return -1;
	if (t1.recvTime === null || t1.recvTime === "") return 1;
	var tt1 = new Date(t1.recvTime).getTime();
	var tt2 = new Date(t2.recvTime).getTime();
	return tt1 - tt2;
}

function adjustTime(timeDat: TimeDat, frames: number, adj: string) {
	timeDat.time = addFrames(frames, timeDat.time);
	if (adj === "ver") timeDat.verTime = addFrames(frames, timeDat.verTime);
	// mark adjustment
	var copyList = timeDat.adjustList.map((x) => x);
	copyList.push(adj);
	timeDat.adjustList = copyList;
}

/*function natAdjustTime(timeDat: TimeDat, frames: number, adj: string) {
	timeDat.time = addFrames(frames, timeDat.time);
	timeDat.verTime = addFrames(frames, timeDat.verTime);
	timeDat.rawTime = addFrames(frames, timeDat.rawTime);
	// mark adjustment
	var copyList = timeDat.adjustList.map((x) => x);
	copyList.push(adj);
	timeDat.adjustList = copyList;
}*/

	/* 
		multi_dat (time cell): an array of time_dats used to represent
			multiple times in the same column
	*/

export type MultiDat = TimeDat[];

export function hasSubTimes(multiDat: MultiDat | null): boolean {
	return multiDat !== null && multiDat.length > 1;
}


/*export function formatMultiDat(mDat) {
	if (mDat === null) return "";
	return formatTime(mDat[0].time);
}*/

	/*
		ver_offset: version offset information
	*/

type SimpleOff = { "a": false, "num": number };
type ComplexOff = { "a": true, "data": { [key: string]: number } };
export type OffsetDat = SimpleOff | ComplexOff

export type VerOffset = {
	"focusVer": VerF | null,
	"offset": OffsetDat
};

export function zeroVerOffset(): VerOffset
{
	return {
		"focusVer": null,
		"offset": { "a": false, "num": 0 }
	};
}

export function newVerOffset(focusVer: VerF | null, offset: OffsetDat): VerOffset
{
	return {
		"focusVer": focusVer,
		"offset": offset
	};
}

export function applyVerOffset(timeDat: TimeDat, verOffset: VerOffset)
{
	// calc offset
	var name = timeDat.rowDef.name;
	var offDat = verOffset.offset;
	var offset = 0;
	if (offDat.a) {
		if (offDat.data[name] !== undefined) offset = offDat.data[name];
		else offset = 0;
	} else offset = offDat.num;
	// apply offset
	var focusVer = verOffset.focusVer;
	var time = timeDat.time;
	if (focusVer === "jp" && timeDat.rowDef.ver === "us") adjustTime(timeDat, offset, "ver");
	else if (focusVer === "us" && timeDat.rowDef.ver === "jp") adjustTime(timeDat, -offset, "ver");
}

	// assumes that the time is for the opposing version
export function applyVerOffsetRaw(stratName: string, time: number, verOffset: VerOffset): number | null
{
	// calc offset
	var offDat = verOffset.offset;
	var offset = 0;
	if (offDat.a) {
		if (offDat.data[stratName] === undefined) return null;
		offset = offDat.data[stratName];
	} else offset = offDat.num;
	// apply offset
	var focusVer = verOffset.focusVer;
	if (focusVer === "jp") return addFrames(offset, time);
	else if (focusVer === "us") return addFrames(-offset, time);
	return null;
}

	/*
		strat_offset: strat offset information
	*/

export type StratOffset = {
	"name": string,
	"rawName": [string, string],
	"offsetType": string | null,
	"offset": number,
	"verOffset"?: [VerF, OffsetDat]
};

export function newStratOffset(name: string, rawName: [string, string], offsetType: string | null, offset: number): StratOffset
{
	return {
		"name": name,
		"rawName": rawName,
		"offsetType": offsetType,
		"offset": offset
	};
}

export function applyStratOffset(timeDat: TimeDat, second: boolean, sOffset: StratOffset, forceAdjust?: number)
{
	var offset = sOffset.offset;
	var time = timeDat.time;
	// null offset ignores forced adjust
	if (sOffset.offsetType === null) return;
	// if force adjustment, use the raw names
	var offName = sOffset.name;
	if (forceAdjust !== undefined) {
		if (second) offName = sOffset.rawName[1];
		else offName = sOffset.rawName[0];
	}
	// apply secondary version offset if it exists + merge offset
	// -- TODO: it's unclear if offset should use this. there are no such stars to test it on
	if (sOffset.verOffset && sOffset.offsetType === "mergeOffset" && second) {
		const [focusVer, vOffset] = sOffset.verOffset;
		applyVerOffset(timeDat, { "focusVer": focusVer, "offset": vOffset });
	}
	// merge offset always offsets the secondary
	if (sOffset.offsetType === "mergeOffset") {
		if (second) adjustTime(timeDat, offset, offName);
		else if (forceAdjust !== undefined) adjustTime(timeDat, 0, offName);
	} else {
		// otherwise, only apply a positive offset
		if (second && sOffset.offset > 0) adjustTime(timeDat, offset, offName); //sOffset.name);
		else if (!second && sOffset.offset < 0) adjustTime(timeDat, -offset, offName); //sOffset.name);
		else if (forceAdjust !== undefined) adjustTime(timeDat, 0, offName);
	}
	//if (second) adjustTime(timeDat, addFrames(offset, time), sOffset.name);
}


export function applyManualOffset(timeDat: TimeDat, frames: number, offName: string)
{
	adjustTime(timeDat, frames, offName);
}