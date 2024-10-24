'use client'

import React, { useState, useEffect } from 'react'
import { newIdent, dropIdent } from './time_table'
import { PlayData, LocalPD, newPlayData, userKeyPD, setNickMapPD,
	linkUserRemotePD, setLocalPD } from './play_data'
import { initGSheet } from './api_xcam'
import { initDailyStar } from './api_season'
import { loadNickMap, loadUserId, postNick } from './api_live'
//import { EditBoard } from './rx_edit_board'
import { DailyBoard } from './rx_daily_board'
import { HistoryBoard } from './rx_history_board'
import { XcamBoard } from './rx_xcam_board'

type MenuOptProps = {
	"id": number,
	"selId": number,
	"setSelId": (i: number) => void,
	"children": React.ReactNode
};

function MenuOpt(props: MenuOptProps): React.ReactNode
{
	var active = (props.id === props.selId).toString()
	return (
		<div className="menu-button" data-active={ active }
			onClick={ () => props.setSelId(props.id) }>{ props.children }</div>
	);
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
	*/

export function MultiBoard(props: {}): React.ReactNode
{
	const [menuId, setMenuId] = useState(0);
	const [playData, setPlayData] = useState(newPlayData());
	const [playReload, setPlayReload] = useState(playData.local as LocalPD | null);
	const [initReload, setInitReload] = useState(0);

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

	// triggered by sub-elements when the player data itself is modified
	const updatePlayData = (ld: LocalPD) => {
		// update player data with whatever local changes
		setPlayData(setLocalPD(playData, ld));
		// if dirty flag is set, post local changes (only relevant to new nickname)
		if (ld.dirtyFlag && ld.userId !== null) {
			var nick = ld.nick;
			if (nick !== null) postNick(ld.userId, nick);
		}
		// reload with the most recent player data, avoids weird race conditions
		setPlayReload(ld);
	};

	// single init data (xcam sheet, daily star season/history state)
	useEffect(() => {
		initGSheet(() => setInitReload(1));
		initDailyStar(() => setInitReload(2));
		reloadPlayData(null);
			//var newData = setNickMapPD(playData, await loadNickMap());
			///updatePlayData(newData);
	}, []);

	// trigger reload on local player data change
	useEffect(() => {
		if (playReload !== null) {
			reloadPlayData(playReload);
			setPlayReload(null);
		}
	}, [playReload]);

	// re-initialize player data on changes
	/*useEffect(() => {
		
	}, [playData]);*/

	// select board
	var board = null;
	if (menuId === 0) {
		board = <DailyBoard playData={ playData }
			reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
	} else if (menuId === 1) {
		board = <HistoryBoard/>;
	} else if (menuId === 2) {
		board = <XcamBoard/>;
	}

	return (
		<div className="content">
			<div className="menu-cont">
				<MenuOpt id={ 0 } selId={ menuId } setSelId={ setMenuId }>Daily</MenuOpt>
				<MenuOpt id={ 1 } selId={ menuId } setSelId={ setMenuId }>History</MenuOpt>
				<MenuOpt id={ 2 } selId={ menuId } setSelId={ setMenuId }>Xcam Sheet</MenuOpt>
			</div>
			<div className="sep"><hr/></div>
			{ board }
		</div>
	);
}