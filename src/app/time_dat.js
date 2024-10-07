
	/*
		functions for reading time in MS
	*/

export function formatTime(time) {
	var ms = time % 100;
	var sec = Math.floor(time / 100) % 60;
	var min = Math.floor(time / 6000);
	if (sec === 0 && min === 0) return "0." + ms;
	else if (min === 0) return sec + "." + ms.toString().padStart(2, '0');
	return min + ":" + sec.toString().padStart(2, '0') + "." + ms.toString().padStart(2, '0');
}

function _secMS(secText) {
	if (!secText.includes('.')) return parseInt(secText) * 100;
	var ft = secText.split('.');
	return (parseInt(ft[0]) * 100) + parseInt(ft[1]);
}

export function rawMS(fillText) {
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

export function msToFrames(ms) {
	var dFrames = Math.floor(ms / 10) * 3;
	var hs = ms % 10;
	var hFrames = 0;
	if (hs >= 3 && hs < 6) hFrames = 1;
	else if (hs >= 6) hFrames = 2;
	return dFrames + hFrames; 
}

export function framesToMS(frames) {
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

export function addFrames(frames, ms) {
	return framesToMS(frames + msToFrames(ms));
}

export function subFrames(frames, ms) {
	return framesToMS(msToFrames(ms) - frames);
}

export function formatFrames(frames) {
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

		 multi_dat (time cell): an array of time_dats used to represent
			multiple rows in the same column
	*/

export function newTimeDat(time, link, note, rowDef)
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

export function maxTimeDat(rowDef)
{
	return newTimeDat(999900, null, null, rowDef);
}

export function formatTimeDat(timeDat) {
	if (timeDat === null) return "";
	return formatTime(timeDat.time);
}

export function formatMultiDat(mDat) {
	if (mDat === null) return "";
	return formatTime(mDat[0].time);
}

	/*
		ver_offset: version offset information
	*/

export function newVerOffset(focusVer, complexOff, offset)
{
	return {
		"focusVer": focusVer,
		"complexOff": complexOff,
		"offset": offset
	}
}

export function applyVerOffset(timeDat, verOffset)
{
	// calc offset
	var name = timeDat.rowDef.name;
	var offset = verOffset.offset;
	if (verOffset.complexOff) {
		if (verOffset.offset[name] !== undefined) offset = verOffset.offset[name];
		else offset = 0;
	}
	// apply offset
	var focusVer = verOffset.focusVer;
	var time = timeDat.time;
	if (focusVer === "jp" && timeDat.rowDef.ver === "us") time = addFrames(offset, time);
	else if (focusVer === "us" && timeDat.rowDef.ver === "jp") time = addFrames(-offset, time);
	timeDat.time = time;
}
