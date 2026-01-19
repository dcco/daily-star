import React from 'react'

import { Ident } from '../time_table'

export type ExColumn =
{
	name: string,
	key: string,
	widthRec?: number,
	dataFun: (id: Ident) => [React.ReactNode, number[]]
};

export function lexicoSortFun(a: number[], b: number[]): number {
	const ml = Math.max(a.length, b.length);
	for (let i = 0; i < ml; i++) {
		if (a[i] === undefined) return -1;
		if (b[i] === undefined) return 1;
		if (a[i] === b[i]) continue;
		return a[i] - b[i];
	}
	return 0;
}
