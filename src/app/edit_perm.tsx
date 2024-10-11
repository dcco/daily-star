
import { Ident, sameIdent } from './time_table'
import { StarDef } from './org_star_def'

	/*
		edit_perm: token denoting which parts of the table are editable
	*/

export type EditPerm = {
	"writeIdList": Ident[],
	"newId": Ident | null
}

export function noEditPerm(): EditPerm
{
	return {
		"writeIdList": [],
		"newId": null
	};
}

export function newEditPerm(writeIdList: Ident[], newId: Ident | null): EditPerm
{
	return {
		"writeIdList": writeIdList,
		"newId": newId
	};
}

export function userEditPerm(userId: Ident | null): EditPerm
{
	if (userId === null) return noEditPerm();
	return {
		"writeIdList": [userId],
		"newId": userId
	}
}

export function hasWritePerm(ep: EditPerm, id: Ident): boolean
{
	for (const writeId of ep.writeIdList) {
		if (sameIdent(writeId, id)) return true;
	}
	return false;
}

export function checkNewPerm(ep: EditPerm): Ident | null
{
	return ep.newId;
}

	/*
		edit_obj: an object which when present, gives editing abilities to a timetable
	*/

export type EditObj = {
	"perm": EditPerm,
	"starDef": StarDef,
	"updateTT": () => void
}

export function newEditObj(ep: EditPerm, starDef: StarDef, updateTT: () => void): EditObj
{
	return {
		"perm": ep,
		"starDef": starDef,
		"updateTT": updateTT
	};
}