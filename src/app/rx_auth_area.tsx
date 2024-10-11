import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup } from 'firebase/auth'

import { DropDownImgMenu } from './rx_dropdown_menu'
import { Ident, newIdent } from './time_table'
import { lookupNick, strIdNick, updateNick } from './play_wrap'

	// firebase initialization

const FB_CONFIG = {
	apiKey: "AIzaSyCVWUF0gW_gRVN4oRv_ZpL6Gj0qUfiLTzo",
	authDomain: "twig-daily-star.firebaseapp.com",
	projectId: "twig-daily-star",
	storageBucket: "twig-daily-star.appspot.com",
	messagingSenderId: "470017859011",
	appId: "1:470017859011:web:dc2b2a85aa02c46c907176"
};
initializeApp(FB_CONFIG);

const provider = new GoogleAuthProvider();
const auth = getAuth();

	/* in-app authorization code */

function _signIn()
{
	signInWithPopup(auth, provider)
	.catch((error) => {
		console.log(error);
		});
}

function _signOut()
{
	auth.signOut();
}

	/* nickname input */

type NickInputProps = {
	"userId": Ident,
	"setNick": (a: string) => void
};

export function NickInput(props: NickInputProps): React.ReactNode
{
	var userId = props.userId;
	var setNick = props.setNick;
	
	// edit state + functions
	const [eState, setEState] = useState({
		"active": false,
		"nick": ""
	});

	const startEdit = () => {
		var _nick = lookupNick(userId);
		if (_nick === null) _nick = "";
		setEState({ "active": true, "nick": _nick });
	};

	const nickEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEState({ "active": true, "nick": e.target.value });
	};

	const stopEdit = (v: string | null) => {
		// cancel signal
		if (v === null) {
			setEState({ "active": false, "nick": "" });
			return;
		}
		// otherwise
		if (v !== "") {
			updateNick(userId, v);
			setNick(v);
		}
		setEState({ "active": false, "nick": v });
	}

	// display node
	var dispNode: React.ReactNode = "";
	if (!eState.active) {
		var nick = strIdNick(userId);
		var nState = "display";
		if (nick === '@me') {
			nick = '---';
			nState = "none";
		}
		dispNode = <div className="nick-disp" data-state={ nState }>{ nick }</div>;
	} else {
		dispNode = <input className="nick-disp" data-state="edit" value={ eState.nick } onChange={ nickEdit }/>;
	}

	// action node
	var actNode: React.ReactNode = <img src="/icons/edit-icon.png" className="edit-icon" onClick={ startEdit }></img>;
	if (eState.active) {
		actNode = [
			<div className="plain-button" onClick={ () => stopEdit(eState.nick) } key="1">Set</div>,
			<div className="cancel-button" onClick={ () => stopEdit(null) } key="2">X</div>
		];
	}

	return (<div className="nick-cont">
		{ dispNode } { actNode }
	</div>);
}

	/* authorization area */

type AuthAreaProps = {
	"userId": Ident | null,
	"setUserId": (a: any) => void,
	"setNick": (a: string | null) => void
};

export function AuthArea(props: AuthAreaProps): React.ReactNode
{
	var userId = props.userId;
	var setUserId = props.setUserId;
	var setNick = props.setNick;

	// when authorization state changes, save token
	useEffect(() => {
		onAuthStateChanged(auth, (_user) => {
			if (_user && _user.email !== null) {
				var userId = newIdent("google", _user.email.split('@')[0]);
				userId.token = _user;
				setUserId(userId);
			} else {
				if (_user) console.log(
					"WARNING: Must use Google account with associated e-mail (e-mail will not be used, it just serves as username in backend).");
				setUserId(null);
			}
		});
	}, []);

	// display authorization state
	var authNode: React.ReactNode = (<div className="login-cont">
		<div className="login-button" onClick={ _signIn }>Log in</div>
	</div>);

	if (userId !== null) {
		var nonFun = () => {};
		var actList = [null, _signIn, _signOut];
		authNode = (<div className="login-cont">
			<DropDownImgMenu src={ userId.token.photoURL } backupSrc="/icons/def-propic.png"
				textList={ [ "@" + userId.name , "Switch User", "Logout"] } actList={ actList }/>
			<NickInput userId={ userId } setNick={ setNick }/>
		</div>);
	}
	/*var logoutNode = "";
	if (user !== null) {
		loginNode = (
			<div className="login-button" image="true" onClick={ _signIn }>
				<img className="login-pic" src={ user.photoURL }></img>
				<div className="login-text"> { user.email.split('@')[0] } </div>
			</div>);
		logoutNode = (<div className="logout-button" onClick={ _signOut }>Logout</div>);
	}

	return (<div className="ident-cont">
		<div>Nick: <div className="nick-box">Twig</div></div>
		<div className="login-cont">
			{ loginNode }
			{ logoutNode }
		</div>
	</div>);*/
	return (<div className="ident-cont">
		{ authNode }
	</div>);
}