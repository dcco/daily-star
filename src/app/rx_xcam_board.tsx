import orgData from './json/org_data.json'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

import { G_SHEET } from './api_xcam'

import { orgStarDef } from './org_star_def'
import { xcamTimeTable } from './xcam_time_table'
import { PlayDB } from './rx_star_row'
import { ViewBoard } from './rx_view_board'
import { procStarSlug, makeStarSlug } from './router_slug'
import { RouterMain, navRM } from './router_main'

export function XcamBoard(props: { rm: RouterMain }): React.ReactNode {
	// process slug when relevant
	const slug = props.rm.core.slug;
	const [defStage, _starSlug, defStar] = procStarSlug(slug);
	var defCache = Array(orgData.length).fill(0);
	defCache[defStage] = defStar;
	
	// star state
	const [stageId, setStageId] = useState(defStage);
	const [starIdCache, setStarIdCache] = useState(defCache);
	const starId = starIdCache[stageId];
	var starDef = orgStarDef(stageId, starId);

	// star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		var newStage = parseInt(e.target.value);
		var newStar = orgData[stageId].starList[0].id;
		setStageId(newStage);
		navRM(props.rm, "xcam", "", makeStarSlug(newStage, newStar));
	};

	const changeStar = (i: number) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
		var newStar = orgData[stageId].starList[i].id;
		navRM(props.rm, "xcam", "", makeStarSlug(stageId, newStar));
	};

	// if route changes, re-render board
	useEffect(() => {
		const [newStage, _, newStar] = procStarSlug(slug);
		if (stageId !== newStage || starIdCache[newStar] !== newStar) {
			starIdCache[newStage] = newStar;
			setStageId(newStage);
			setStarIdCache(starIdCache.map((x) => x));
		}
	}, [props.rm.core]);

	// stage select option nodes
	var stageOptNodes = orgData.map((stage, i) =>
		<option key={ stage.name } value={ i }>{ stage.name }</option>
	);

	// star select nodes
	var starList = orgData[stageId].starList;
	var starBtnNodes = starList.map((star, i) => {
		var flag = (starIdCache[stageId] === i) ? "true" : "false";
		//var starId = starList[i].id;
		//var url = "/xcam?star=" + makeStarSlug(stageId, starId);
		// <Link className="link-span" href={ "/xcam?star=" + makeStarSlug(stageId, starId) }></Link>
		return <div key={ star.name } className="star-name link-cont" data-sel={ flag }
			onClick={ () => { changeStar(i) } }>{ star.name }</div>;
	});

	// standard xcam player list
	var playNameList: string[] = [];
	if (G_SHEET.userMap !== null) {
		playNameList = Object.entries(G_SHEET.userMap.stats).map(([k, v]) => v.id.name);
	}
	var playDB: PlayDB = {
		"baseUrl": "/xcam/players",
		"nameList": playNameList
	};

	// main nodes to pass into viewer
	var stageSelNode = (
		<div className="stage-select">
			<select value={ stageId }
				onChange={ changeStage }>
				{ stageOptNodes }
			</select>
		</div>);

	var starSelNode = (
		<div className="star-select">
			{ starBtnNodes }
		</div>);

	return <ViewBoard stageId={ stageId } starDef={ starDef } ttFun={ xcamTimeTable }
		cornerNode={ stageSelNode } headerNode={ starSelNode } playDB={ playDB }/>;
}