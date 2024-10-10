
	// generic data structure function
/* function updateArray(a, i, v) {
	return a.map((old, j) => (i === j) ? v : old);
}*/

export function lookupGrid(grid, i, j)
{
	var v = grid[i + "_" + j];
	if (!v) return null;
	return v;
}

export function setGrid(grid, i, j, v)
{
	newGrid[i + "_" + j] = v;
}

/*export function updateGrid(grid, i, j, v)
{
	var newGrid = {};
	for (const [kx, vx] of Object.entries(grid)) {
		newGrid[kx] = vx;
	}
	newGrid[i + "_" + j] = v;
	return newGrid;
}*/