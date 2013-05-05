//'use strict'

var localStream;
var localDescription;
var message;
var remoteIce;

/*--------------------------------->
|
|  Set up Websocket connection to interact with Webserver
|
----------------------------------->
*/
var log = function(msg){
				console.log(msg);
				$('#log').append('\n<p>' + msg + '</p>');
			}

var WsConn = {
	init: function(){
		ws = new WebSocket("ws://localhost:1234");

		ws.onopen = function() {
			log('connected');
		};

		ws.onmessage = function (msg) {
			message = msg;
			log('GOT RemoteSDP type = ' + msg.data);
			var sdp = {sdp: msg.data, type: "answer"};
			pc.setRemoteDescription(new RTCSessionDescription(sdp));
			var ice = {"sdpMLineIndex":0,"sdpMid":"audio","candidate":"a=candidate:1001321590 1 tcp 2130714367 91.115.80.149 54260 typ host generation 0\r\n"};
			addIce(ice);
			log('ADDED RemoteSDP');
			addStream();
		};

		ws.onclose = function() {
			log("Disconnected");
		};

		ws.onerror = function() {
			log('cannot establish an connection to Webserver');
		};
	}
}

/*--------------------------------->
|
|  Signaling Jsep Answer/Offers ect.
|
----------------------------------->
*/



/*--------------------------------->
|
|  Set Peerconnection functions
|
----------------------------------->
*/

//get sure navigator.getUserMedia works, although browser is firefox or chrome
var PeerConnection = (webkitRTCPeerConnection || mozRTCPeerConnection || webkitDeprecatedRTCPeerConnection);
var pcConfiguration = 	{"iceServers": [
{"url": "stun:provserver.televolution.net"},
{"url": "stun:stun1.voiceeclipse.net"}
]};

var pc = new PeerConnection(pcConfiguration);

pc.onicecandidate = function(desc){
	log("got ICE: " + JSON.stringify(desc.candidate));
	//TODO: ice übersetzen und mit strophejs schicken
	//send jingel/ice
}

pc.onaddstream = function(remoteStream){
	log("Remotestream arrived");
	$('#remoteView').attr('src', URL.createObjectURL(remoteStream));
}

pc.onopen = function(){
	log('Peerconnection established');
}

var addStream = function(){
	pc.addStream(localStream);
}

var addIce = function(candidate){
	pc.addIceCandidate(new RTCIceCandidate(candidate));
}

var createOffer = function(){
	pc.createOffer(gotDescription);
}

var gotDescription = function(desc){
	log('got SDP: ' + desc.sdp);
	pc.setLocalDescription(desc);
	localDescription = desc;
}

function success(e){
	console.log('successful request: ' + JSON.stringify(e));
}

function error(e){
	console.log('request error: ' + e);
}


/*--------------------------------->
|
|         Mediastream Handling
|
----------------------------------->
*/
//get sure navigator.getUserMedia works, although browser is firefox or chrome
navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMeida || navigator.mozGetUserMedia);

var LocalMedia = {
	init: function(){
		this.getLocalStream();
	},
	getLocalStream: function(){
		navigator.webkitGetUserMedia(
		{
			audio: true
		},
		function(stream){
			log('Got local stream');
			localStream = stream;
			$('#localView').attr('src', URL.createObjectURL(stream));
		},
		this.onError()
		);
	},
	onError: function(e){
		log('Cannot get local stream');
	}
}
//start initial function to get the local mediastream
LocalMedia.init();

	/*---------------------XML to JSON-----------------------*/
	/*
// Changes XML to JSON
function xmlToJson(xml) {
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};
*/