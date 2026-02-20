	/*
		implements a fake router to navigate the site. the reason we use this fake
		routing is so that the site does not have to reload.

		we also in some places use the nextjs 'Link' element. the advantage that this
		has is it has the standard properties of a link (browser history, url preview, middle-click, etc)
		the disadvantage is that it cannot be used as an event (onchange for stage select).
		that being said, we should probably use it in more places.
	*/

export type Slug = {
	[key: string]: string
};

export function readSlug(slug: Slug, k: string): string | null
{
	if (slug[k] === undefined) return null;
	return slug[k];
}

export type RouterCore = {
	boardId: number,
	subId: number,
	slug: Slug
};

export type RouterMain = {
	core: RouterCore,
	setCore: (a: RouterCore) => void
}

export function newRouterCore(boardId: number, _subId?: number, _slug?: Slug): RouterCore
{
	var subId = 0;
	if (_subId !== undefined) subId = _subId;
	return {
		'boardId': boardId,
		'subId': subId,
		'slug': _slug !== undefined ? _slug : {}
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
/*
function handleMultiSlug(slug: string, s1: string, s2: string): string
{
	if (!slug.includes(";")) {
		if (slug === "") return "";
		return "?" + s1 + "=" + slug;
	}
	const sll = slug.split(';');
	if (sll[0] === "null") return "?" + s2 + "=" + sll[1];
	return "?" + s2 + "=" + sll[1] + "&" + s1 + "=" + sll[0];
}*/

function serializeSlug(slug: Slug): string
{
	const slugList = Object.entries(slug);
	if (slugList.length === 0) return "";
	var param = "";
	for (const [k, v] of slugList)
	{
		if (param === "") param = param + "?" + k + "=" + v;
		else param = param + "&" + k + "=" + v;
	}
	return param;
}
	
	/*
		core function used to set the react router state
	*/

function navData(board: string, subId: string, slug: Slug): [string, number, number] | null
{
		// home boards
		// - history
	if (board === "home" && subId === "history") {
		//const suffix = handleMultiSlug(slug, "star", "season");
		return ["/home/history" + serializeSlug(slug), 0, 3];
		// - scores
	} else if (board === "home" && subId === "scores") {
		//const suffix = handleMultiSlug(slug, "id", "season");
		return ["/home/scores" + serializeSlug(slug), 0, 4];
	} else if (board === "home" && subId === "scores/monthly") {
		//const suffix = handleMultiSlug(slug, "id", "season");
		return ["/home/scores/monthly" + serializeSlug(slug), 0, 10];
	} else if (board === "home" && subId === "scores/weekly") {
		// suffix = handleMultiSlug(slug, "id", "season");
		return ["/home/scores/weekly" + serializeSlug(slug), 0, 11];
		// - weekly
	} else if (board === "home" && subId === "weekly") {
		return ["/home/weekly", 0, 2];
		// - news
	} else if (board === "home" && subId === "news") {
		return ["/home/news", 0, 5];
		// - default
	} else if (board === "home") {
		return ["/home", 0, 0];
		// xcam boards
	} else if (board === "xcam" && subId === "players") {
		return ["/xcam/players" + serializeSlug(slug), 1, 1];
	} else if (board === "xcam") {
		return ["/xcam" + serializeSlug(slug), 1, 0];
		// beta boards
	} else if (board === "beta" && subId === "players") {
		return ["/beta/players" + serializeSlug(slug), 4, 1];
	} else if (board === "beta") {
		return ["/beta" + serializeSlug(slug), 4, 0];
		// misc
	} else if (board === "about") {
		return ["/about", 2, 0];
	} else if (board === "editor") {
		return ["/editor", 3, 0];
	} else if (board === "support") {
		return ["/support", 5, 0];
	}
	return null;
}

	/*
		nav: used for manual navigation to a new URL
		- uses the arguments to set the route core state, which will trigger react to re-render
	*/

export function navRM(rm: RouterMain, board: string, sub: string, slug: Slug)
{
	var res = navData(board, sub, slug);
	if (res === null) throw("Attempted to navigate to invalid board: " + board);
	var [url, boardId, subId] = res;
	pushHistory(url);
	rm.setCore({ 'boardId': boardId, 'subId': subId, 'slug': slug });
}

	/*
		reload: used for implicit navigation to a new URL (using a Link)
		- uses the URL to set the router core state, which will trigger react to re-render
		> if URL cannot be read, give up and do a hard refresh (will probably land on error page)
	*/

export function reloadRM(rm: RouterMain)
{
	var path = window.location.pathname;
	// attempt to read board name
	var pathParts = path.split("/");
	// if not enough entries, give up and hard refresh
	// - for "too many" entries, we treat the entire path as a sub-id
	if (pathParts.length <= 1) {
		console.log("hard reload");
		window.location.reload();
		return;
	}
	var boardName = pathParts[1];
	// otherwise, read sub id if it exists
	var subName = "";
	if (pathParts.length > 2) {
		subName = pathParts[2];
		for (let i = 3; i < pathParts.length; i++) {
			subName = subName + "/" + pathParts[i];
		}
	}
	// create slug
	var slug: Slug = {};
	if (window.location.search !== "") {
		var qstr = window.location.search.substring(1);
		var paramList = qstr[0].split('&');
		for (const param of paramList) {
			var sstr = param.split('=');
			if (sstr.length > 1) slug[sstr[0]] = sstr[1];
		}
		// if too many query strings, give up and hard refresh
		/*if (qstr[0].split('&').length > 1) {
			window.location.reload();
			return;
		}
		var sstr = qstr.split('=');
		if (sstr.length > 1) slug = sstr[1];*/
	}
	// attempt to navigate
	var res = navData(boardName, subName, slug);
	if (res === null) {
		console.log("hard reload");
		window.location.reload();
		return;
	}
	var [url, boardId, subId] = res;
	rm.setCore({ 'boardId': boardId, 'subId': subId, 'slug': slug });
}