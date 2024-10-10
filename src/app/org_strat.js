
//import ultData from './json/ult_struct.json'

	/* data structure for an individual strat */
/*
function newStratDef(name, diff) {
	return {
		"name": name,
		"diff": diff,
		"variant_list": [],
		"id_list": [],
	};
}

function addVariantStratDef(strat, v, i) {
	strat.variant_list.push([v, i]);
	strat.id_list.push(i);
}
*/
	/* data structure for storing strat data per star */
/*
function newStarDef(name) {
	return {
		"name": name,
		"jp_set": {},
		"us_set": {}
	};
}

function _addStratStarSet(set, stratName, diff, vList, rowId) {
	if (set[stratName] === undefined) {
		set[stratName] = newStratDef(stratName, diff);
	}
	var strat = set[stratName];
	addVariantStratDef(strat, vList, rowId);
}

function addRowStarDef(star, tagList, rowId) {
	var stratName = "Standard";
	var verFlag = "any";
	var diff = "normal";
	var vList = [];
	for (let i = 0; i < tagList.length; i++) {
		switch (tagList[i]) {
			// note if version specific
		case "JP":
			verFlag = "jp";
			break;
		case "US":
			verFlag = "us";
			break;
			// for now, do nothing with misctimer rows
		case "hard":
			diff = "hard";
			break;
		case "easy":
			diff = "easy";
			break;
		case "second":
			diff = "second";
			break;
		case "rt":
			break;
		case "misc":
			return;
		default:
			// if the tag is a variant, set variant
			if (tagList[i].startsWith("alt")) {
				var vType = tagList[i].split(":")[1];
				vList.push(vType);
			// otherwise, except tag as strat name
			} else {
				stratName = tagList[i];
			}
		}
	}
	// final add to star
	if (verFlag !== "us") {
		_addStratStarSet(star.jp_set, stratName, diff, vList, rowId);
	}
	if (verFlag !== "jp") {
		_addStratStarSet(star.us_set, stratName, diff, vList, rowId);
	}
}
*/
	/* organizes stars/strats/times FROM strat json */
/*
function organizeStar(star, rowId) {
	var starDat = newStarDef(star.name);
	star.rows.map((stratRow, i) => {
		addRowStarDef(starDat, stratRow, rowId);
		rowId = rowId + 1;
	});
	return [starDat, rowId];
}

function organizeStage(stage, rowId) {
	var starList = [];
	// skip first 2 rows + stage rta rows
	if (!stage.ext) rowId = rowId + 2 + stage.rta_len;
	// for each star
	stage.stars.map((star, j) => {
		var [starDat, rowNext] = organizeStar(star, rowId);
		starList.push(starDat);
		rowId = rowNext;
	});
	// skip last row
	return [starList, rowId + 1];
}

function organizeData() {
	var stageList = [];
	var rowId = 0;
	ultData.stages.map((stage, j) => {
		var [starList, rowNext] = organizeStage(stage, rowId);
		stageList.push({
			'name': stage.name,
			'color': stage.color,
			'starList': starList
		});
		rowId = rowNext;
	});
	return stageList;
}

export const orgData = organizeData();*/