'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' 

import { newIdent, dropIdent } from './time_table'
import { PlayData, LocalPD, newPlayData, userKeyPD, setNickMapPD,
	linkUserRemotePD, setLocalPD } from './play_data'
import { initGSheet } from './api_xcam'
import { initDailyStar, initHistory } from './api_season'
import { loadNickMap, loadUserId, postNick } from './api_live'

import { DailyStar } from './rx_daily_star'
import { XcamFull } from './rx_xcam_full'
import { About } from './rx_about'

type HeadTabProps = {
	"id": number,
	"selId": number,
	"setSelId": (i: number) => void,
	"children": React.ReactNode
};

function HeadTab(props: HeadTabProps): React.ReactNode
{
	var active = (props.id === props.selId).toString()
	return <div className="head-tab" data-active={ active } onClick={ () => props.setSelId(props.id) }>
		<div className="inner-tab">{ props.children }</div>
	</div>;
}

	/*
		data loaded from the backend can be split into three main categories
		- data read once at start, never modified [global]
		- data read/modified from user actions, local to one type of element [local/single]
		- data read/modified from user actions, relevant to multiple elements [external/multi]

		roughly, our data can be classified as such:
		- xcam sheet data [global]
		- DS seasonal daily data [global]
		- DS seasonal history data [global]
		- live time table data [local]
		- player auth data [external]
		- player nickname data [external]

		external data is by far the most difficult type of data to handle.
		we split external data into two parts:
		- remote data, read from the API
		- local data, updated by the user/frontend

		there are three actions that affect this data
		- post new time: reloads from remote
		- login: updates local data, reloads from remote
		- set nick: updates local data (triggers API call) [optional reload from remote]
	*/

export function MultiBoard(props: { boardId?: number, subId?: number, slug?: string }): React.ReactNode
{
	// router stuff
	var boardId = 0;
	var subId = 0;
	if (props.boardId !== undefined) boardId = props.boardId;
	if (props.subId !== undefined) subId = props.subId;
	const router = useRouter();

	// main state
	const [mainId, setMainId] = useState(boardId);
	const [initReload, setInitReload] = useState(0);

	const updateMainId = (i: number) => {
		setMainId(i);
		if (i === 1) router.push("/xcam");
		else if (i === 2) router.push("/about");
		else router.push("/home");
	};

	// the concept with play/local data is that the user modifies local data,
	// but they read from the play data.
	// when either is modified, we sync them up by adding the local to player data
	const [playData, setPlayData] = useState(newPlayData());
	const [localData, setLocalData] = useState(playData.local);
	
	// triggered by sub-elements when the player data itself is modified
	const updatePlayData = (ld: LocalPD) => {
		// update local data with whatever local changes
		setLocalData(ld);
		// if dirty flag is set, post local changes (only relevant to new nickname)
		if (ld.dirtyFlag && ld.userId !== null) {
			var nick = ld.nick;
			if (nick !== null) postNick(ld.userId, nick);
		}
	};

	// triggered by sub-elements to load player data while they load local data
	const reloadPlayData = async (ld: LocalPD | null) => {
		// reload all nickname data
		var newData = setNickMapPD(playData, await loadNickMap());
		if (ld !== null) newData.local = ld;
		// sync player with remote id
		if (newData.local.userId !== null) {
			var nId = await loadUserId(newData.local.userId);
			if (nId !== null) newData = linkUserRemotePD(newData, nId);
		}
		setPlayData(newData);
	};

	// single init data (xcam sheet, daily star season/history state)
	useEffect(() => {
		initGSheet(() => setInitReload(1));
		initDailyStar(() => setInitReload(2));
		initHistory(() => setInitReload(3));
		reloadPlayData(null);
	}, []);

	// re-initialize player data on changes
	useEffect(() => {
		if (playData.local !== localData) {
			reloadPlayData(localData);
		}
	}, [playData, localData]);

	// board switcher
	var board = null;
	if (mainId === 0) {
		board = <DailyStar playData={ playData } updatePlayData={ updatePlayData } reloadPlayData={ reloadPlayData }/>;
	} else if (mainId === 1) {
		board = <XcamFull subId={ subId } slug={ props.slug } key={ props.slug }/>;
	} else {
		board = <About/>;
	}

	return (
		<div className="content">
		<div className="cont-head">
			<HeadTab id={ 0 } selId={ mainId } setSelId={ updateMainId }>Daily Star</HeadTab>
			<HeadTab id={ 1 } selId={ mainId } setSelId={ updateMainId }>Xcam Viewer</HeadTab>
			<HeadTab id={ 2 } selId={ mainId } setSelId={ updateMainId }>About</HeadTab>
		</div>
		<div className="cont-body headless">
			{ board }
		</div>
		</div>
	);
}
