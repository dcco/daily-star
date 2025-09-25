import { useState } from 'react'

	/*
		implements a fake router to navigate the site. the reason we use this fake
		routing is so that the site does not have to reload.

		we also in some places use the nextjs 'Link' element. the advantage that this
		has is it has the standard properties of a link (browser history, url preview, middle-click, etc)
		the disadvantage is that it cannot be used as an event (onchange for stage select).
		that being said, we should probably use it in more places.
	*/

export type RouterCore = {
	boardId: number,
	subId: number,
	slug: string
};

export type RouterMain = {
	core: RouterCore,
	setCore: (a: RouterCore) => void
}

export function newRouterCore(boardId: number, _subId?: number, _slug?: string): RouterCore
{
	var subId = 0;
	var slug = "";
	if (_subId !== undefined) subId = _subId;
	if (_slug !== undefined) slug = _slug;
	return {
		'boardId': boardId,
		'subId': subId,
		'slug': slug
	};
}

export function newRouterMain(core: RouterCore, setCore: (a: RouterCore) => void): RouterMain
{
	return { 'core': core, 'setCore': setCore };
}

function pushHistory(url: string)
{
	window.history.pushState({}, url, url);
	document.title = "Daily Star - " + url.substring(1);
}

function navData(board: string, subId: string, slug: string): [string, number, number] | null
{
	if (board === "home" && subId === "history") {
		if (slug === "") return ["/home/history", 0, 3];
		else return ["/home/history?star=" + slug, 0, 1];
	} else if (board === "home" && subId === "stats") {
		return ["/home/stats", 0, 4];
	} else if (board === "home" && subId === "weekly") {
		return ["/home/weekly", 0, 2];
	} else if (board === "home" && subId === "news") {
		return ["/home/news", 0, 5];
	} else if (board === "home") {
		return ["/home", 0, 5];
	} else if (board === "xcam" && subId === "players") {
		if (slug === "") return ["/xcam/players", 1, 1];
		else return ["/xcam/players?name=" + slug, 1, 1];
	} else if (board === "xcam") {
		if (slug === "") return ["/xcam", 1, 0];
		else return ["/xcam?star=" + slug, 1, 0];
	} else if (board === "about") {
		return ["/about", 2, 0];
	}
	return null;
}

export function navRM(rm: RouterMain, board: string, sub: string, slug: string)
{
	var res = navData(board, sub, slug);
	if (res === null) throw("Attempted to navigate to invalid board: " + board);
	var [url, boardId, subId] = res;
	pushHistory(url);
	rm.setCore({ 'boardId': boardId, 'subId': subId, 'slug': slug });
}

export function reloadRM(rm: RouterMain)
{
	var path = window.location.pathname;
	// attempt to read board name
	var pathParts = path.split("/");
	// if not enough / too many entries, give up and hard refresh
	if (pathParts.length <= 1 || pathParts.length > 3) {
		window.location.reload();
		return;
	}
	var boardName = pathParts[1];
	// otherwise, read sub id + slug if it exists
	var subName = "";
	var slug = "";
	if (pathParts.length > 2) subName = pathParts[2];
	if (window.location.search !== "") {
		var qstr = window.location.search.substring(1);
		// if too many query strings, give up and hard refresh
		if (qstr[0].split('&').length > 1) {
			window.location.reload();
			return;
		}
		var sstr = qstr.split('=');
		if (sstr.length > 1) slug = sstr[1];
	}
	// attempt to navigate
	var res = navData(boardName, subName, slug);
	if (res === null) {
		window.location.reload();
		return;
	}
	var [url, boardId, subId] = res;
	rm.setCore({ 'boardId': boardId, 'subId': subId, 'slug': slug });
}