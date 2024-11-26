
import { Ident, AuthIdent, keyIdent } from './time_table'

export type NickMap = {
	[key: string]: string
};

	/*
		DEPRECATED CONCEPT	
		* newUserSync: this flag is used to trigger a nickname data reload when a new user
			may have potentially been created.
				- "uninit": nickname data has not done initialize load (do not trigger any reloads)
				- "sync": user id has been loaded + player id synced
				- "unsync": user id has been changed, player id not synced yet
	*/

	/*
		player data is split into two parts:
			- locally modified data (current user, local nickname)
			- remote data (current user remote id, nickname mapping)
		react elements can only write/update the local data. updates to the remote data
		can only be triggered through full reloads, although the local data can still
		trigger API calls when we want it to be pushed to the backend (local nickname changes)
		> local
			* userId: also stores the remote id. in cases where the user is changed, the
				remote id is simply invalidated
			* nick: current nickname - null if not set by user (can be replaced by remote result)
			* dirtyFlag: flag indicating whether nickname is out of date with the remote DB
		> remote
			[remoteId]: stored in the userId for convenience sake
			* nickMap: mapping of other nicknames, nicknames stored under key "remote@p_id"
				in case other nickname cases are ever required
	*/

export type LocalPD = {
	"userId": AuthIdent | null,
	"nick": string | null,
	"dirtyFlag": boolean
}

export type PlayData = {
	"local": LocalPD,
	"nickMap": NickMap
};

export function newPlayData(): PlayData
{
	return {
		"local": { 
			"userId": null,
			"nick": null,
			"dirtyFlag": false
		},
		"nickMap": {}
	};
}

export function userKeyPD(pd: PlayData): string
{
	if (pd.local.userId === null) return "@null";
	return pd.local.userId.name;
}

export function setUserLD(ld: LocalPD, userId: AuthIdent | null): LocalPD
{
	return {
		"userId": userId,
		"nick": null,
		"dirtyFlag": false
	};
}

export function setUserNickLD(ld: LocalPD, nick: string, dirty: boolean): LocalPD
{
	return {
		"userId": ld.userId,
		"nick": nick,
		"dirtyFlag": dirty
	};
}

export function setNickMapPD(pd: PlayData, nickMap: NickMap): PlayData
{
	return {
		"local": pd.local,
		"nickMap": nickMap
	};
}
/*
export function setDirtyPD(ld: LocalPD): LocalPD
{
	return {
		"userId": ld.userId,
		"nickMap": ld.nickMap,
		"dirtyFlag": false
	};
}*/

function canonNickPD(pd: PlayData, userId: AuthIdent, remoteId: string): string | null
{
	if (pd.local.nick !== null) return pd.local.nick;
/*	var localNick = pd.nickMap["google@" + userId.name];
	if (localNick !== undefined) return localNick;*/
	var remoteNick = pd.nickMap["remote@" + remoteId];
	if (remoteNick !== undefined) return remoteNick;
	return null;
}

export function linkUserRemotePD(pd: PlayData, remoteId: string): PlayData
{
	// synchronize nicknames
	if (pd.local.userId !== null) {
		pd.local.userId.remoteId = remoteId;
		var canonNick = canonNickPD(pd, pd.local.userId, remoteId);
		if (canonNick !== null) {
			pd.local.nick = canonNick;
			pd.nickMap["google@" + pd.local.userId.name] = canonNick;
			pd.nickMap["remote@" + remoteId] = canonNick;
		}
	}
	// return new player data obj
	return {
		"local": pd.local,
		"nickMap": pd.nickMap
	};
}

export function setLocalPD(pd: PlayData, local: LocalPD): PlayData
{
	return {
		"local": local,
		"nickMap": pd.nickMap
	}
}

/*export function copyPlayData(pd: PlayData): PlayData
{
	return {
		"userId": pd.userId,
		"nickMap": pd.nickMap
	};
}*/

function lookupNickPD(pd: PlayData, id: Ident): string | null
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
	else if (id.service === "xcam") return id.name;
	return "@me"; // + id.name;
}
/*
export function updateNick(nickMap: NickMap, id: Ident, nick: string)
{
	nickMap[keyIdent(id)] = nick;
}

*/