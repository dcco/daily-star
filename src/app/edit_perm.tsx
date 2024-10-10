
import { Ident, sameIdent } from './time_table'

export type EditPerm = {
	"canEdit": boolean,
	"writeIdList": Ident[],
	"newId": Ident | null
}

export function noEditPerm(): EditPerm
{
	return {
		"canEdit": false,
		"writeIdList": [],
		"newId": null
	};
}

export function newEditPerm(writeIdList: Ident[], newId: Ident | null): EditPerm
{
	return {
		"canEdit": true,
		"writeIdList": writeIdList,
		"newId": newId
	};
}

export function userEditPerm(userId: Ident | null): EditPerm
{
	if (userId === null) return noEditPerm();
	return {
		"canEdit": true,
		"writeIdList": [userId],
		"newId": userId
	}
}

export function hasWritePerm(ep: EditPerm, id: Ident): boolean
{
	if (!ep.canEdit) return false;
	for (const writeId of ep.writeIdList) {
		if (sameIdent(writeId, id)) return true;
	}
	return false;
}

export function checkNewPerm(ep: EditPerm): Ident | null
{
	if (!ep.canEdit) return null;
	return ep.newId;
}