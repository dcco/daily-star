
import { keyIdent } from './time_table'

export const P_DATA = {
	nickMap: {}
}

export function lookupNick(id)
{
	var key = keyIdent(id);
	if (P_DATA.nickMap[key]) return P_DATA.nickMap[key];
	return null;
}

export function strIdNick(id)
{
	var nick = lookupNick(id);
	if (nick !== null) return nick;
	if (id.service === "remote") return "@player-" + id.name;
	else if (id.service === "google") return "@me";
	return id.name;
}

export function updateNick(id, nick)
{
	P_DATA.nickMap[keyIdent(id)] = nick;
}
