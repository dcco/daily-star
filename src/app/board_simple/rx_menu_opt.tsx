import React from 'react'

type MenuOptProps<T> = {
	"id": T,
	"selId": T,
	"exId"?: T[],
	"setSelId": (i: T) => void,
	"children": React.ReactNode
};

export function MenuOpt<T>(props: MenuOptProps<T>): React.ReactNode
{
	var active = props.id === props.selId
	if (!active && props.exId) {
		for (const exId of props.exId) {
			if (exId === props.selId) active = true;
		}
	}
	return (
		<div className="menu-button" data-active={ active.toString() }
			onClick={ () => props.setSelId(props.id) }>{ props.children }</div>
	);
}

export function MenuOptX<T>(props: MenuOptProps<T> & { "eqFun": (a: T, b: T) => boolean }): React.ReactNode
{
	var active = props.eqFun(props.id, props.selId)
	if (!active && props.exId) {
		for (const exId of props.exId) {
			if (props.eqFun(exId, props.selId)) active = true;
		}
	}
	return (
		<div className="menu-button" data-active={ active.toString() }
			onClick={ () => props.setSelId(props.id) }>{ props.children }</div>
	);
}