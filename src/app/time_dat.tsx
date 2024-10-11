
import { VerF, RowDef } from './strat_def'

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
		* time: int - adjusted time
		* link: string
		* note: string
		* rowDef: row_def - xcam row represented by the time cell
	*/

export type TimeDat = {
	"rawTime": number,
	"time": number,
	"link": string | null,
	"note": string | null,
	"rowDef": RowDef
}

export function newTimeDat(time: number, link: string | null, note: string | null, rowDef: RowDef): TimeDat
{
	if (rowDef === undefined) throw("New time datum created with incomplete arguments.")
	return {
		"rawTime": time,
		"time": time,
		"link": link,
		"note": note,
		"rowDef": rowDef
	};
}

export function maxTimeDat(rowDef: RowDef): TimeDat
{
	return newTimeDat(999900, null, null, rowDef);
}

export function formatTimeDat(timeDat: TimeDat): string {
	if (timeDat === null) return "";
	return formatTime(timeDat.time);
}

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
	if (focusVer === "jp" && timeDat.rowDef.ver === "us") time = addFrames(offset, time);
	else if (focusVer === "us" && timeDat.rowDef.ver === "jp") time = addFrames(-offset, time);
	timeDat.time = time;
}
