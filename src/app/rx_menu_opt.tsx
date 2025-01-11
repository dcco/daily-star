import React from 'react'

type MenuOptProps<T> = {
	"id": T,
	"selId": T,
	"setSelId": (i: T) => void,
	"children": React.ReactNode
};

export function MenuOpt<T>(props: MenuOptProps<T>): React.ReactNode
{
	var active = (props.id === props.selId).toString()
	return (
		<div className="menu-button" data-active={ active }
			onClick={ () => props.setSelId(props.id) }>{ props.children }</div>
	);
}

export function MenuOptX<T>(props: MenuOptProps<T> & { "eqFun": (a: T, b: T) => boolean }): React.ReactNode
{
	var active = props.eqFun(props.id, props.selId).toString()
	return (
		<div className="menu-button" data-active={ active }
			onClick={ () => props.setSelId(props.id) }>{ props.children }</div>
	);
}