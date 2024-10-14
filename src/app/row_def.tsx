
import { Ver, Variant } from './variant_def'

	/*
		row_def: definition of an xcam row
		* name: string - parent strat name
		* sheet: string - name of parent sheet
		* ver: ver - version
		* variant_list: array[variant] - list of variants used by row
	*/

export type RowDef = {
	"name": string,
	"sheet": string,
	"ver": Ver,
	"variant_list": Variant[]
};

export function newRowDef(name: string, sheet: string, ver: Ver, v_list: Variant[]): RowDef
{
	return {
		"name": name,
		"sheet": sheet, 
		"ver": ver,
		"variant_list": v_list
	};
}

export function zeroRowDef(name: string): RowDef
{
	return newRowDef(name, "main", "jp", []);
}

export function begRowDef(name: string): RowDef
{
	return newRowDef(name, "beg", "both", []);
}