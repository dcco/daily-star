import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup } from 'firebase/auth'

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

export function AuthButton(props)
{
	var user = props.user;
	var setUser = props.setUser;

	// when authorization state changes, save token
	useEffect(() => {
		onAuthStateChanged(auth, (_user) => {
			if (_user) {
				console.log(_user);
				setUser(_user);
			} else setUser(null);
		});
	}, []);

	// display authorization state
	var loginNode = (
		<div className="login-button" onClick={ _signIn }>Log in</div>
	);

	if (user !== null) {
		loginNode = (<img className="login-pic" height="25px" src={ user.photoURL }></img>);
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
		<div className="login-cont">
			{ loginNode }
			<div>
				<div className="nick-cont">
					<div className="nick-disp">Twig</div>
					<img src="/icons/edit-icon.png" className="edit-icon"></img>
					<div className="log-ctrl-box">
						<div className="log-ctrl">Logout</div>
					</div>
				</div>
			</div>
		</div>
	</div>);
}