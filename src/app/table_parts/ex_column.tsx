import React from 'react'

import { Ident } from '../time_table'

export type ExColumn =
{
	name: string,
	key: string,
	widthRec?: number,
	dataFun: (id: Ident) => [React.ReactNode, number[]]
};