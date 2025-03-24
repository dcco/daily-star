
import React, { useState, useEffect } from 'react'

import { PlayData, LocalPD } from '../play_data'
import { G_DAILY, GlobNorm, readCodeList } from '../api_season'
import { AuthArea } from './rx_auth_area'
import { DSEditBoard } from './rx_ds_edit_board'

	/*
		######################
		DAILY STAR LEADERBOARD
		######################
		react element which displays/edits times for
		the current daily star.
	*/

type DailyBoardProps = {
	"playData": PlayData,
	"weekly": GlobNorm | null,
	"overrideMessage"?: string,
	"setPlayData": (a: LocalPD) => void,
	"reloadPlayData": () => void
}

export function DailyBoard(props: DailyBoardProps): React.ReactNode {
	const playData = props.playData;
	const setPlayData = props.setPlayData;
	const reloadPlayData = props.reloadPlayData;
	const ds = G_DAILY;
	//const [ds, setDSObj] = useState(null as DailyStarObj | null);
	//const [okFlag, setOkFlag] = useState(true);

	// initialize daily star data once
	/*useEffect(() => {
		const f = async () => {
			var newDS = await loadToday();
			if (newDS === null) setOkFlag(false);
			else setDSObj(newDS);
		};
		f();
	}, []);*/


	// main display content toggle
	var failCode = 0;
	var mainNode: React.ReactNode = <div className="load-cont">Loading the Daily Star...</div>;
	var message: string | null = null;
	if (ds.status !== "null") {
		if (ds.starGlob === undefined) {
			if (ds.status === "early") mainNode = <div className="load-cont">Waiting for new season to start.</div>;
			else if (ds.status === "none") mainNode = <div className="load-cont">Season has ended.</div>;
			else failCode = 500;
		} else if (ds.starGlob.day === null) {
			mainNode = <div className="load-cont">Season has ended.</div>;
		} else {
			// use weekly if selected
			var starGlob = ds.starGlob;
			var dayOffset = ds.dayOffset;
			if (props.weekly !== null) {
				starGlob = props.weekly;
				dayOffset = starGlob.day;
			}
			if (starGlob.message !== null) message = starGlob.message;
			if (starGlob.special === null) {
				// prep editing board
				var starCodeList = readCodeList(starGlob.stageid, starGlob.staridlist);
				//var starIdList = starGlob.staridlist.split(',');
				mainNode = <DSEditBoard startDate={ ds.season.startdate }
					day={ dayOffset } weekly={ starGlob.weekly }
					starCodeList={ starCodeList }
					//stageId={ starGlob.stageid } starIdList={ starIdList }
					playData={ playData } reloadPlayData={ reloadPlayData }/>;
			} else if (starGlob.special === "skip") {
				mainNode = <div className="load-cont">No Daily Star: { starGlob.message }</div>;
			}
		}
	}
	if (props.overrideMessage !== undefined) message = props.overrideMessage;

	// failure
	if (failCode !== 0) {
		var failText = "Try refreshing the page.";
		if (failCode === 500) "Try refreshing the page or send CODE [500] to the administrator.";
		mainNode = <div className="load-cont">
			<div>Failed to load Daily Star!</div>
			<div>({ failText })</div>
		</div>;
	}

	var msgNode: React.ReactNode = null;
	if (message !== null) msgNode = <div className="msg-cont">{ message }</div>;

	return (
		<div className="super-cont">
			<div className="msg-cont">Take the <a className="msg-link" href={ "https://forms.gle/BHpptf6or9hoYXDW9" }>Daily Star Survey</a>!
				(Feedback will be used for scores next season)</div><br/>
			{ msgNode }
			{ mainNode }
			<div className="sep"><hr/></div>
			<AuthArea playData={ playData } setPlayData={ setPlayData }/>
		</div>
	);

}
