
import { TimeDat } from '../time_dat'
import { Ident, AuthIdent, matchIdent } from '../time_table'
import { StarDef } from '../org_star_def'
import { DSPerm } from '../play_data'

	/*
		edit_perm: token denoting which parts of the table are editable
	*/

export type EditPerm = {
	//"writeIdList": AuthIdent[],
	"writeId": AuthIdent | null,
	"newId": AuthIdent | null,
	"perm": DSPerm
}

export function noEditPerm(): EditPerm
{
	return {
		"writeId": null,
		"newId": null,
		"perm": "user"
	};
}

export function newEditPerm(writeId: AuthIdent | null, newId: AuthIdent | null, perm: DSPerm): EditPerm
{
	return {
		"writeId": writeId,
		"newId": newId,
		"perm": perm
	};
}

export function userEditPerm(userId: AuthIdent | null, perm: DSPerm): EditPerm
{
	return {
		"writeId": userId,
		"newId": userId,
		"perm": perm
	}
}

export function selfWritePerm(ep: EditPerm, id: Ident): boolean
{
	if (ep.writeId === null) return false;
	return matchIdent(ep.writeId, id);
}

export function hasWritePerm(ep: EditPerm, id: Ident): boolean
{
	if (ep.writeId === null) return false;
	return ep.perm !== "user" || matchIdent(ep.writeId, id);
	/*for (const writeId of ep.writeIdList) {
		if (matchIdent(writeId, id)) return true;
	}
	return false;*/
}

export function checkNewPerm(ep: EditPerm): AuthIdent | null
{
	return ep.newId;
}

	/*
		edit_obj: an object which when present, gives editing abilities to a timetable
	*/

export type EditObj = {
	"perm": EditPerm,
	"starDef": StarDef,
	"updateTT": (id: Ident, timeList: TimeDat[], delList: TimeDat[], verifList: TimeDat[]) => void
}

export function newEditObj(ep: EditPerm, starDef: StarDef,
	updateTT: (id: Ident, timeList: TimeDat[], delList: TimeDat[], verifList: TimeDat[]) => void): EditObj
{
	return {
		"perm": ep,
		"starDef": starDef,
		"updateTT": updateTT
	};
}