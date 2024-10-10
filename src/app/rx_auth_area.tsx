import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup } from 'firebase/auth'

import { DropDownImgMenu } from './rx_dropdown_menu'
import { newIdent } from './time_table'
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

export function NickInput(props)
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

	const nickEdit = (e) => {
		setEState({ "active": true, "nick": e.target.value });
	};

	const stopEdit = (v) => {
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
	var dispNode = null;
	if (!eState.active) {
		var nick = strIdNick(userId);
		var nState = "display";
		if (nick === '@me') {
			nick = '---';
			nState = "none";
		}
		dispNode = <div className="nick-disp" state={ nState }>{ nick }</div>;
	} else {
		dispNode = <input className="nick-disp" state="edit" value={ eState.nick } onChange={ nickEdit }/>;
	}

	// action node
	var actNode = <img src="/icons/edit-icon.png" className="edit-icon" onClick={ startEdit }></img>;
	if (eState.active) {
		actNode = [
			<div className="nick-button" onClick={ () => stopEdit(eState.nick) } key="1">Set</div>,
			<div className="cancel-button" onClick={ () => stopEdit(null) } key="2">X</div>
		];
	}

	return (<div className="nick-cont">
		{ dispNode } { actNode }
	</div>);
}

	/* authorization button */

export function AuthButton(props)
{
	var userId = props.userId;
	var setUserId = props.setUserId;
	var setNick = props.setNick;

	// when authorization state changes, save token
	useEffect(() => {
		onAuthStateChanged(auth, (_user) => {
			if (_user) {
				console.log(_user);
				var userId = newIdent("google", _user.email.split('@')[0]);
				userId.token = _user;
				setUserId(userId);
			} else setUserId(null);
		});
	}, []);

	// display authorization state
	var authNode = (<div className="login-cont">
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