
import { sameIdent } from './time_table'

export function noEditPerm()
{
	return {
		"canEdit": false
	};
}

export function newEditPerm(writeIdList, newId)
{
	return {
		"canEdit": true,
		"writeIdList": writeIdList,
		"newId": newId
	};
}

export function userEditPerm(userId)
{
	if (userId === null) return noEditPerm();
	return {
		"canEdit": true,
		"writeList": [userId],
		"newId": userId
	}
}

export function hasWritePerm(ep, id)
{
	if (!ep.canEdit) return false;
	for (const writeId of writeIdList) {
		if (sameIdent(writeId, id)) return true;
	}
	return false;
}

export function hasNewPerm(ep)
{
	if (!ep.canEdit) return false;
	return ep.newId !== null;
}