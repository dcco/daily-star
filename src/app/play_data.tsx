
import { Ident, AuthIdent, keyIdent } from './time_table'

export type NickMap = {
	[key: string]: string
};

	/*
		the user's nickname is stored in two places - the DB, and the local mapping
		both nicks will be stored in nickmap, one under 'remote@p_id' the other
		under 'google@name', with the latter taking precedence when both exist.
	*/

export type PlayData = {
	"userId": AuthIdent | null,
	"nickMap": NickMap
};

export function newPlayData(): PlayData
{
	return {
		"userId": null,
		"nickMap": {}
	};
}

export function userKeyPD(pd: PlayData): string
{
	if (pd.userId === null) return "@null";
	return pd.userId.name;
}

export function setUserPD(pd: PlayData, userId: AuthIdent | null): PlayData
{
	return {
		"userId": userId,
		"nickMap": pd.nickMap
	};
}

export function setUserNickPD(pd: PlayData, nick: string): PlayData
{
	if (pd.userId !== null) {
		pd.nickMap["google@" + pd.userId.name] = nick;
		if (pd.userId.remoteId) pd.nickMap["remote@" + pd.userId.remoteId] = nick;
	}
	return {
		"userId": pd.userId,
		"nickMap": pd.nickMap
	};
}

export function setNickMapPD(pd: PlayData, nickMap: NickMap): PlayData
{
	return {
		"userId": pd.userId,
		"nickMap": nickMap
	};
}

function canonNickPD(pd: PlayData, userId: AuthIdent, remoteId: string): string | null
{
	var localNick = pd.nickMap["google@" + userId.name];
	if (localNick !== undefined) return localNick;
	var remoteNick = pd.nickMap["remote@" + remoteId];
	if (remoteNick !== undefined) return remoteNick;
	return null;
}

export function linkUserRemotePD(pd: PlayData, remoteId: string): PlayData
{
	// synchronize nicknames
	if (pd.userId !== null) {
		pd.userId.remoteId = remoteId;
		var canonNick = canonNickPD(pd, pd.userId, remoteId);
		if (canonNick !== null) {
			pd.nickMap["google@" + pd.userId.name] = canonNick;
			pd.nickMap["remote@" + remoteId] = canonNick;
		}
	}
	// return new player data obj
	return {
		"userId": pd.userId,
		"nickMap": pd.nickMap
	};
}

/*export function copyPlayData(pd: PlayData): PlayData
{
	return {
		"userId": pd.userId,
		"nickMap": pd.nickMap
	};
}*/

export function lookupNickPD(pd: PlayData, id: Ident): string | null
{
	var key = keyIdent(id);
	if (pd.nickMap[key]) return pd.nickMap[key];
	return null;
}

export function strIdNickPD(pd: PlayData, id: Ident): string
{
	var nick = lookupNickPD(pd, id);
	if (nick !== null) return nick;
	if (id.service === "remote") return "@player-" + id.name;
	return "@" + id.name;
}
/*
export function updateNick(nickMap: NickMap, id: Ident, nick: string)
{
	nickMap[keyIdent(id)] = nick;
}

*/