
type VariantToggleProps = {
	"variants": string[] | undefined,
	"state": boolean[],
	"toggle": (i: number) => void
};

export function VariantToggle(props: VariantToggleProps) {
	if (props.variants === undefined || props.variants.length === 0) return <div></div>;
	var variants = props.variants;

	var vNodeList: React.ReactNode[] = [];
	variants.map((vName, i) => {
		var vstr = "[" + (i + 1) + "] ";
		var vNode: React.ReactNode = <div className="variant-button"
			data-active={ props.state[i] } onClick={ function() { props.toggle(i); } }>
				<div className="variant-num">{ vstr }</div>{ vName }</div>;
		vNodeList.push(vNode);
	});
	return <div className="variant-box">
		<div className="variant-title">Variants: </div>{ vNodeList }</div>;
}