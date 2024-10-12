'use client'

import React, { useState, useEffect } from 'react'
import { updateGSheet } from './xcam_wrap'
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

export function MultiBoard(props: {}): React.ReactNode {
	const [menuId, setMenuId] = useState(1);
	const [reloadFlag, setReloadFlag] = useState(false);

	// initialize xcam sheet once
	useEffect(() => {
		updateGSheet(setReloadFlag);
	}, []);

	// select board
	var board = null;
	if (menuId === 0) {
		board = <EditBoard/>;
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