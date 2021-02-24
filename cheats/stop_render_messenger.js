/*
	Lưu ý dành cho messenger web! - https://www.messenger.com

	cài extention của chrome "Custom JavaScript for Websites 2" (cjs):
	https://chrome.google.com/webstore/detail/custom-javascript-for-web/ddbjnfjiigjmcpcpkmhogomapikjbjdk

	Dành cho group ma sói (https://www.messenger.com/t/2993797820720134) và chat private Minh Thư

	Copy đoạn script dưới vào cjs, check "enable for this host" và Click Save
*/

(function () {
	const observeDOM = (function(){
		const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

		return function(obj, callback){
			if( !obj || !obj.nodeType === 1 ) return;

			if( MutationObserver ){
				const obs = new MutationObserver(function(mutations, observer){
					callback(mutations);
				})

				obs.observe( obj, { childList:true, subtree:true });
			} else if( window.addEventListener ){
				obj.addEventListener('DOMNodeInserted', callback, false);
				obj.addEventListener('DOMNodeRemoved', callback, false);
			}
		}
	})();

	const ACTION_XPATH = '/html/body/div[1]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[1]/div[1]/div';
	const PROFILE_THUBNAIL_XPATH = '/html/body/div[1]/div/div/div/div[2]/span/div[1]/div';
	const BODY_XPATH = '/html/body';
	const WOLF_GROUP_ID = '2993797820720134';
	const MINH_THU_ID = '100010456068287'; // 'minhthu.atadi.vn';

	const GROUP_HEADER_XPATH = '/html/body/div[1]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[1]/div[1]/div/div[1]/div/div[2]/div';
	const GROUP_HEADER_STATUS_XPATH = '/html/body/div[1]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[1]/div[1]/div/div[1]/div/div[2]/div/div[3]';

	const STOP_STATUS_TEXT = 'STOP';
	const ENABLE_FETCH_STATUS_TEXT = 'Enable Fetch';

	const NUMBER_GROUP_OUTGOING = 1;
	const NUMBER_GROUP_INCOMING = 3;
	const NUMBER_MINHTHU_INCOMING = 1;

	const noop = () => {};

	function debounce(callback, wait) {
	  let timerId;
	  wait = wait || 500;

	  return (...args) => {
	    clearTimeout(timerId);
	    timerId = setTimeout(() => {
	      callback(...args);
	    }, wait);
	  };
	}

	var _callbackObserve = function () {
		if (isWolfGroup() || isMinhThu()) {
			let outgoing = document.querySelectorAll('[data-testid="outgoing_group"]');
			[...outgoing].slice(0, outgoing.length - NUMBER_GROUP_OUTGOING).forEach(m => m.children && [...m.children].forEach( c => c.remove()));

			let numberGrab = isWolfGroup() ? NUMBER_GROUP_INCOMING : NUMBER_MINHTHU_INCOMING;
			let incoming = document.querySelectorAll('[data-testid="incoming_group"]');
			[...incoming].slice(0, incoming.length - numberGrab).forEach(m => m.children && [...m.children].forEach( c => c.remove()));
		}
	}

	function getElementByXpath(path) {
		return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}

	function isWolfGroup () {
		return document.location.pathname.indexOf(WOLF_GROUP_ID) > -1
	}

	function isMinhThu () {
		return document.location.pathname.indexOf(MINH_THU_ID) > -1
	}

	observeDOM( document.querySelector('body'), debounce(_callbackObserve));
})();