
type VariantToggleProps = {
	"variants": string[] | undefined,
	"state": boolean[],
	"toggle": (i: number) => void,
	"extAll"?: boolean
};

export function VariantToggle(props: VariantToggleProps) {
	if (props.variants === undefined || props.variants.length === 0) return <div></div>;
	var variants = props.variants;

	var vNodeList: React.ReactNode[] = [];
	variants.map((vName, i) => {
		var vstr = "[" + (i + 1) + "] ";
		if (props.extAll) {
			if (i !== 0) vNodeList.push(", ");
			vNodeList.push(<div key={ i } className="variant-inner"><div className="variant-num">{ vstr }</div> - </div>);
			vNodeList.push(<i key={ "n" + i }>{ vName }</i>);
		} else {
			var vNode: React.ReactNode = <div key={ i } className="variant-button"
				data-active={ props.state[i] } onClick={ function() { props.toggle(i); } }>
					<div className="variant-num">{ vstr }</div>{ vName }</div>;
			vNodeList.push(vNode);
		}
	});
	if (props.extAll) {
		return <div className="variant-box">
			<div className="variant-title">Variants: { vNodeList }</div></div>;
	}
	return <div className="variant-box">
		<div className="variant-title">Variants: </div>{ vNodeList }</div>;
}