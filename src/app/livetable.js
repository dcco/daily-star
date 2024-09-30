import React, { useState, useEffect } from 'react'

import { orgColList, filterVarColList } from "./org_star_def"
import { asPool, orgVariantList, addTimePool, buildTimeTable, updateTimeTable } from "./timetable"
import { StarTable } from "./startable"

	/*
		###############
		LIVE STAR TABLE
		###############
		star table react element where timetable information
		is synced with our backend database.
	*/

async function loadTimeTable(stageId, starId, verState) {
	// load rows
	const getReq = await fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5500/times/read?stage=" +
		stageId + "&star=" + starId);
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	// enumerate strats
	var colList = orgColList(stageId, starId, verState);
	var stratPool = asPool(colList, "name", "colId");
	// build time table
	const timePool = {};
	for (const data of res.res) {
		var stratId = stratPool[data.stratname].colId;
		var verMap = stratPool[data.stratname].ver_map;
		if (stratId !== undefined) {
			var ver = "both";
			if (verMap !== undefined) ver = verMap[stratId];
			addTimePool(timePool, data.player, stratId, data.time, data.time, ver);
		}
	}
	return buildTimeTable(timePool, colList.length);
}

function completeEditRow(colTotal, editText, colOrder) {
	// get columns / variant indices
	/*var colList = orgColList(stageId, starId);
	var variantList = orgVariantList(colList, variant);
	// fill new row
	var newRow = Array(colList.length).fill(null);
	for (let i = 0; i < variantList.length; i++) {
		var colId = variantList[i];
		newRow[colId] = rawMS(editText[i]);
	}
	return newRow;*/
	// fill new row
	var newRow = Array(colTotal).fill(null);
	for (let i = 0; i < editText.length; i++) {
		var colId = colOrder[i][0];
		newRow[colId] = rawMS(editText[i]);
	}
	return newRow;
}

function postNewTimes(stageId, starId, name, diffText, colOrder) {
	/*var stratSet = Object.entries(orgData[stageId].starList[starId].jp_set);
	var stratList = stratSet.map((strat, i) => {
		const [stratName, stratDef] = strat;
		return stratName;
	});*/

	// get columns / variant indices
	//var colList = orgColList(stageId, starId);
	//var variantList = orgVariantList(colList, variant);
	// get list of times to submit
	var submitList = [];
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
}

export function LiveStarTable(props)
{
	const stageId = props.stageId;
	const starId = props.starId;
	const variant = props.variant;
	const fs = props.fs;

	// time table
	const [timeTable, setTimeTable] = useState([]);
	const [reload, setReload] = useState(1);

	// time table loader
	useEffect(() => {
		var dirty = (reload !== 0);
		const f = async () => {
			if (dirty === 2) setTimeTable(await loadTimeTable(stageId, starId, fs));
		}
		setTimeout(f, reload);
		setReload(0);
	}, [reload]);

	// edit function
	const editTT = (name, dfText, colOrder) => {
		// get columns / column total
		var colList = orgColList(stageId, starId, fs);
		// complete the row and update time table
		//var newRow = completeEditRow(stageId, starId, variant, dfText, colOrder);
		var newRow = completeEditRow(colList, dfText, colOrder);
		var tt = updateTimeTable(timeTable, name, newRow);
		setTimeTable(tt);
		// sync the times to the database
		postNewTimes(stageId, starId, name, dfText, colOrder);
		setReload(1000); // slight offset so the database has time to actually update
	}

	var _colList = orgColList(stageId, starId, fs);

	// add sort record + relevant records
	var sortRM = orgRecordMap(stageId, starId, [true, true], true);
	var relRM = orgRecordMap(stageId, starId, fs, true);
	applyRecordMap(_colList, "sortRecord", sortRM);
	applyRecordMap(_colList, "record", relRM);

	var colList = filterVarColList(_colList, variant);

	return (<StarTable colList={ colList } timeTable={ timeTable } canWrite="true" editTT={ editTT }></StarTable>);
}
