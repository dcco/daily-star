import { DEV } from '../rx_multi_board'
import orgData from '../json/org_data.json'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

import { G_SHEET } from '../api_xcam'

import { RawStarDef, orgStarDef } from '../org_star_def'
import { xcamTimeTable } from '../xcam_time_table'
import { PlayDB } from '../table_parts/rx_star_row'
import { ViewBoard } from '../board_simple/rx_view_board'
import { procStarSlug, makeStarSlug } from '../router_slug'
import { RouterMain, navRM } from '../router_main'

type XcamBoardProps = {
	rm: RouterMain,
	showStd: boolean,
	// TO DELETE
	beta: boolean,
	hrefBase: [string, string, string]
}

export function XcamBoard(props: XcamBoardProps): React.ReactNode {
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

	// navigation handling
	var [baseDir, subDir, playerDir] = props.hrefBase;
	/*"xcam";
	var subDir = "";
	if (props.beta) {
		baseDir = "home";
		subDir = "beta_xcam";
	}*/

	// star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		var newStage = parseInt(e.target.value);
		var newStar = orgData[stageId].starList[0].id;
		setStageId(newStage);
		navRM(props.rm, baseDir, subDir, makeStarSlug(newStage, newStar));
	};

	const changeStar = (i: number) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
		var newStar = orgData[stageId].starList[i].id;
		navRM(props.rm, baseDir, subDir, makeStarSlug(stageId, newStar));
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

	// star list w/ index, sans pure virtual stars
	var rawStarList = (orgData[stageId].starList as unknown[]) as RawStarDef[];
	var starList = rawStarList.map((star, i) => [star, i] as [RawStarDef, number]).filter(([star, i]) => {
		var isVirtual = true;
		Object.values(star.jp_set).map((row) => { if (!row.virtual) isVirtual = false; });
		Object.values(star.us_set).map((row) => { if (!row.virtual) isVirtual = false; });
		return !isVirtual || props.beta;
	});

	// star select nodes
	var starBtnNodes = starList.map(([star, i]) => {
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
		"baseUrl": playerDir,//"/xcam/players",
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

	var starSelNode = (<div className="star-select">
			{ starBtnNodes }
		</div>);

	return <ViewBoard kind="view" stageId={ stageId } starDef={ starDef } ttFun={ xcamTimeTable }
		cornerNode={ stageSelNode } headerNode={ starSelNode } showStd={ props.showStd } playDB={ playDB }/>;
}