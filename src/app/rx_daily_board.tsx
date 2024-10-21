
import React, { useState, useEffect } from 'react'

import { PlayData } from './play_data'
import { DailyStarObj, loadToday } from './season_wrap'
import { AuthArea } from './rx_auth_area'
import { DSEditBoard } from './rx_ds_edit_board'

	/*
		
	*/

	/*
		######################
		DAILY STAR LEADERBOARD
		######################
		react element which displays/edits times for
		the current daily star.
	*/

type DailyBoardProps = {
	"playData": PlayData,
	"setPlayData": (a: PlayData) => void
}

export function DailyBoard(props: DailyBoardProps): React.ReactNode {
	const playData = props.playData;
	const setPlayData = props.setPlayData;

	const [ds, setDSObj] = useState(null as DailyStarObj | null);
	const [okFlag, setOkFlag] = useState(true);

	// initialize daily star data once
	useEffect(() => {
		const f = async () => {
			var newDS = await loadToday();
			if (newDS === null) setOkFlag(false);
			else setDSObj(newDS);
		};
		f();
	}, []);


	// main display content toggle
	var failCode = 0;
	var mainNode: React.ReactNode = <div className="load-cont">Loading the Daily Star...</div>;
	if (ds !== null) {
		if (ds.starGlob === undefined) {
			if (ds.status === "early") mainNode = <div className="load-cont">Waiting for new season to start.</div>;
			else failCode = 500;
		} else {
			var starGlob = ds.starGlob;
			var starIdList = ds.starGlob.staridlist.split(',');
			mainNode = <DSEditBoard day={ ds.dayOffset }
				stageId={ ds.starGlob.stageid } starIdList={ starIdList }
				playData={ playData } setPlayData={ setPlayData }/>;
		}
	} else if (!okFlag) failCode = 400;

	// failure
	if (failCode !== 0) {
		var failText = "Try refreshing the page.";
		if (failCode === 500) "Try refreshing the page or send CODE [500] to the administrator.";
		mainNode = <div className="load-cont">
			<div>Failed to load Daily Star!</div>
			<div>({ failText })</div>
		</div>;
	}

	return (
		<div className="super-cont">
			{ mainNode }
			<div className="sep"><hr/></div>
			<AuthArea playData={ playData } setPlayData={ setPlayData }/>
		</div>
	);

}
