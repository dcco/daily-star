
import { Ident, keyIdent } from './time_table'

export type NickData = {
	"nickMap": { [key: string]: string }
}

export const P_DATA: NickData = {
	"nickMap": {}
}

export function lookupNick(id: Ident): string | null
{
	var key = keyIdent(id);
	if (P_DATA.nickMap[key]) return P_DATA.nickMap[key];
	return null;
}

export function strIdNick(id: Ident): string
{
	var nick = lookupNick(id);
	if (nick !== null) return nick;
	if (id.service === "remote") return "@player-" + id.name;
	else if (id.service === "google") return "@me";
	return id.name;
}

export function updateNick(id: Ident, nick: string)
{
	P_DATA.nickMap[keyIdent(id)] = nick;
}
