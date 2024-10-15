'use client'

import React, { useState, useEffect } from 'react'
import { newIdent, dropIdent } from './time_table'
import { PlayData, newPlayData, userKeyPD, setNickMapPD, linkUserRemotePD, lookupNickPD } from './play_data'
import { updateGSheet } from './xcam_wrap'
import { loadNickMap, loadUserId, postNick } from './live_wrap'
import { EditBoard } from './rx_edit_board'
import { ViewBoard } from './rx_view_board'

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

export function MultiBoard(props: {}): React.ReactNode
{
	const [menuId, setMenuId] = useState(0);
	const [playData, setPlayData] = useState(newPlayData());
	const [reloadFlag, setReloadFlag] = useState(false);
	
	/* 
		whenever the player data is changed, synchronizes nickname information
	*/
	const updatePlayData = async (newData: PlayData) => {
		// if user is the same as before, post nickname
		if (userKeyPD(playData) === userKeyPD(newData) && newData.userId !== null) {
			var nick = lookupNickPD(newData, dropIdent(newData.userId));
			if (nick !== null) await postNick(newData.userId, nick);
		}
		// sync player with remote id whenever possible
		if (newData.userId !== null) {
			var nId = await loadUserId(newData.userId);
			if (nId !== null) newData = linkUserRemotePD(newData, nId);
		}
		// finalize new data
		setPlayData(newData);
	};

	// initialize xcam sheet + player data once
	useEffect(() => {
		updateGSheet(setReloadFlag);
		const _load = async () => {
			updatePlayData(setNickMapPD(playData, await loadNickMap()));
		};
		_load();
	}, [reloadFlag]);

	// re-initialize player data on changes
	/*useEffect(() => {
		
	}, [playData]);*/

	// select board
	var board = null;
	if (menuId === 0) {
		board = <EditBoard playData={ playData } setPlayData={ (pd) => updatePlayData(pd) }/>;
	} else if (menuId === 1) {
		board = <ViewBoard/>;
	}

	return (
		<div className="content">
			<div className="menu-cont">
				<MenuOpt id={ 0 } selId={ menuId } setSelId={ setMenuId }>Daily</MenuOpt>
				<MenuOpt id={ 1 } selId={ menuId } setSelId={ setMenuId }>All-Time</MenuOpt>
			</div>
			<div className="sep"><hr/></div>
			{ board }
		</div>
	);
}