
export function ExtToggle(props) {
	var state = props.state;
	return (<div className="ver-cont">
		<div className="toggle-box">
			<div className="toggle-button" plain="true" active={ state.toString() } onClick={ props.toggle }>
				<div className="toggle-inner">Show Extensions</div>
			</div>
		</div>
	</div>);
}