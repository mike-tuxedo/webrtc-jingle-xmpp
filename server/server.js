
var fullRemoteID = null;
var fullLocalID = null;
var bareRemoteID = 'jingle@j46760.servers.jiffybox.net';
var bareLocalID = 'mike@j46760.servers.jiffybox.net';

var strophe = require("./strophe.js").Strophe;
var dutil   = require("./dutil.js");

var Strophe = strophe.Strophe;
var $iq     = strophe.$iq;
var $msg    = strophe.$msg;
var $build  = strophe.$build;
var $pres   = strophe.$pres;
var BOSH_SERVICE = 'http://bosh.metajack.im:5280/xmpp-httpbind'
var options = { };
var xmppConn = null;


var Logger = {
	log: function(msg) {
				console.log('\n' + msg);
			},
	rawInput: function (data){
					var regex = /purple/;
					var cand = /candidate/;
					if(regex.exec(data) && cand.exec(data)){
						var remoteSDP = getSDP(data.toString());
						if(remoteSDP){
							wsConn.send(remoteSDP);
						}

					}
					console.log("\n>>>>>>>>>>>>\nReceived:", data + '\n>>>>>>>>>>>>>>>>');
				},
	rawOutput: function (data){
					console.log("\n<<<<<<<<<<<<\nSent:", data + '\n<<<<<<<<<<<<<<<');
				},
	iqSuccess: function (){
					console.log('message angekommen');
				},
	iqError: function (){
					console.log('message fehlerhaft');
				}
};

var parser = require('./sdpToAndFromJingle');
var getSDP = parser.getSDP;
var getJingle = parser.getJingle;
var log = Logger.log;


/*---------------------------*/
/*   Connection to browser   */
/*---------------------------*/

var Server = require('ws').Server;
var browserCon = new Server({port: '1234'});
var wsConn = null;
log('Start connecting with BROWSER ....');

browserCon.on('connection', function(ws){
	log('Connection to BROWSER established');
	wsConn = ws;

	ws.on('message', function(message){
		try{
			msg = JSON.parse(message);
		}
		catch(e){
			log('WEBSOCKET: Message is not a JSON', e);
			log('ERROR: ' + String(message));
			return;
		}

		switch(msg.subject){
			case 'init':
								log('WEBSOĆKET: got init message');
								break;
			case 'connXMPP':
								log('WEBSOCKET: connecting to xmpp');
								connect({username: bareLocalID,
									password: '123',
									endpoint: BOSH_SERVICE,
									route: ''
								});
								break;
			case 'status':
								log('WEBSOCKET: set presence');
								if(msg.status === 'online')
									xmppConn.send($pres({from: bareLocalID, to: bareRemoteID}));
								else
									xmppConn.send($pres({from: bareLocalID, to: bareRemoteID, type: 'unavailable'}));
								break;
			case 'subscribe':
								log('WEBSOCKET: scubscribe');
								xmppConn.send($pres({from: fullLocalID, to: bareRemoteID, type: 'subscribe'}));
								break;
			case 'unsubscribe':
								log('WEBSOCKET: scubscribe');
								xmppConn.send($pres({from: fullLocalID, to: bareRemoteID, type: 'unsubscribe'}));
								break;
			case 'subscribed':
								log('WEBSOCKET: scubscribed to jingle');
								xmppConn.send($pres({from: fullLocalID, to: fullRemoteID, type: 'subscribed'}));
								break;
			case 'sdp':
								log('WEBSOCKET: got sdp from browser');
								xmppConn.sendIQ(sdpStanza(),Logger.iqSuccess,Logger.iqError);
		        				break;
		    case 'setRemJID':
		    					log('WEBSOCKET: set remote fullJID');
		    					fullRemoteID = msg.jid;
		    					break;
		    case 'setLocJID':
		    					log('WEBSOCKET: set local fullJID');
		    					fullLocalID = msg.jid;
		    					break;
			case 'ice':
						        log('WEBSOCKET: got ice from browser');
						        break;
			case 'getDig':
								log('WEBSOCKET: get Discovery info');
								xmppConn.send($iq({from: bareLocalID, to: 'j46760.servers.jiffybox.net', type: 'get', id: 'discovery-info'})
												.c('query', {xmlns: 'http://jabber.org/protocol/disco#info'})
												.up()
											.up()
										);
								break;
			case 'getDigOfClient':
								log('WEBSOCKET: get Discovery info');
								xmppConn.send($iq({from: fullLocalID, to: fullRemoteID, type: 'get', id: 'discovery-info'})
												.c('query', {xmlns: 'http://jabber.org/protocol/disco#info'})
												.up()
											.up()
										);
								break;

			case 'getRoster':
								log('WEBSOCKET: get Roster');
								xmppConn.send($iq({from: bareLocalID, type: 'get'})
												.c('query', {xmlns: 'jabber:iq:roster'})
												.up()
											.up()
										);
								break;
			case 'disconn':
								log('WEBSOCKET: reconnect to xmpp');
								disconnect();
								break;
			case 'close':
								log('WEBSOCKET: close connections');
								disconnect();
								process.exit(0);
								break;
			default:
						        log('WEBSOCKET: unknown message');
						        parseJingleToSDP(msg);
	    }
	});

	ws.on('close', function(message){
		log('WEBSOCKET: ' + message);
		xmppCon.disconnect();
	});
});


/*--------------------------------*/
/*      XMPP Server Connection    */
/*--------------------------------*/

//Thanks to node-xmpp-bosh for this great implementation
//of the stophe.js client framework as an node-module





function connect(options) {
    xmppConn = new Strophe.Connection(options.endpoint);
    xmppConn.rawInput = Logger.rawInput;
    xmppConn.rawOutput = Logger.rawOutput;
	xmppConn.connect(options.username, options.password, onConnect, null, null, options.route);
}

function disconnect() {
    xmppConn.disconnect();
}

function onConnect(status)
{
	//console.log("onConnect:", status, dutil.rev_hash(Strophe.Status)[status]);
    if (status == Strophe.Status.CONNECTING) {
		log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
		log('Strophe failed to connect.');
		process.exit(1);
    } else if (status == Strophe.Status.DISCONNECTING) {
		log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
		log('Strophe is disconnected.');
		//process.exit(0);
	} else if (status == Strophe.Status.CONNECTED) {
		log('Strophe is connected.');
    }
}


function sdpStanza(){
	var iqStanza = $iq({to: fullRemoteID, type: 'set', id: 'sdpStanza'})
					.c('jingle', {xmlns: 'urn:xmpp:jingle:1', action: 'session-initiate', initiator: fullLocalID, sid: 'sid' })
						.c('content', {creator: 'initiator', name: 'audio'})
							.c('description', {xmlns: 'urn:xmpp:jingle:apps:rtp:1', profile: 'RTP/SAVPF', media: 'audio'})
								.c('payload-type', {id: '103', name: 'ISAC', clockrate: '16000'}).up()
								.c('payload-type', {id: '104', name: 'ISAC', clockrate: '32000'}).up()
								.c('payload-type', {id: '111', name: 'opus', clockrate: '48000'}).c('parameter', {name: 'minptime', value: '10'}).up().up()
								.c('payload-type', {id: '0', name: 'PCMU', clockrate: '8000'}).up()
								.c('payload-type', {id: '8', name: 'PCMA', clockrate: '8000'}).up()
								.c('payload-type', {id: '107', name: 'CN', clockrate: '48000'}).up()
								.c('payload-type', {id: '106', name: 'CN', clockrate: '32000'}).up()
								.c('payload-type', {id: '105', name: 'CN', clockrate: '16000'}).up()
								.c('payload-type', {id: '13', name: 'CN', clockrate: '8000'}).up()
								.c('payload-type', {id: '126', name: 'telephone-event', clockrate: '8000', maxptime: '60'}).up()
							.up()
							.c('encryption', {required: '1'})
								.c('crypto', {'crypto-suite': 'AES_CM_128_HMAC_SHA1_80', 'key-params': 'inline:Sv26gl3hOiCJ0rxZ2wWHC2K+9UdE1oGZUenOmF/o', 'session-params': '', tag: '1'}).up()
								.c('crypto', {'crypto-suite': 'AES_CM_128_HMAC_SHA1_32', 'key-params': 'inline:RHiVK5mn01CXzLnZiAa230KGJwwnaX2CY/ytjCqR', 'session-params': '', tag: '0'}).up()
							.up()
							.c('transport', {xmlns: 'urn:xmpp:jingle:transports:raw-udp:1', pwd: '9JR7GZRZzYAHFkFmdG9DHADx', ufrag: 'TrbVa7ZyJ/HJNLyu'})
								.c('candidate', {ip: '10.0.0.3', port: '54744', protocol: 'udp', type: 'host', generation: '0'}).up()
								.c('candidate', {ip: '88.117.115.117', port: '52272', protocol: 'udp', type: 'srflx', generation: '0'}).up()
								.c('candidate', {ip: '10.0.0.3', port: '58811', protocol: 'tcp', type: 'host', generation: '0'}).up()
							.up()
						.up()
					.up();

    return iqStanza;
}

/*-----set of stanzas for testing------*/
/*
>>>aus xep-0166
$iq({from: 'mike@j46760.servers.jiffybox.net', to: 'jingle@j46760.servers.jiffybox.net', type: 'set', id: 'zid615d9'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1', action: 'session-initiate', initiator: 'mike@j46760.servers.jiffybox.net', sid: 'a73sjjvkla37jfea' })
              .c('content', {creator: 'initiator', name: 'this-is-a-stub'})
                .c('description', {xmls: 'urn:xmpp:jingle:apps:stub:0'}).up()
                .c('transport', {xmlns: 'urn:xmpp:jingle:transports:stub:0'}).up()
              .up()
            .up()
          .up();

>>>fügt freund zum roster hinzu
$iq({from: 'mike@j46760.servers.jiffybox.net', type: 'set', id: 'roster1'})
					.c('query', {xmlns: 'jabber:iq:roster'})
						.c('item', {jid: 'jingle@j46760.servers.jiffybox.net', name: 'jingle'})
						.up()
					.up()
				.up();

>>>zeigt alle freunde im roster 1
$iq({from: 'mike@j46760.servers.jiffybox.net', type: 'get', id: 'roster1'})
					.c('query', {xmlns: 'jabber:iq:roster'})
					.up()
				.up();

>>>sende eine nachricht
$msg({to: 'jingle@j46760.servers.jiffybox.net', type: 'chat'})
					.c('body').t('How do you do?');

>>>ping to server
$iq({to: 'mike@j46760.servers.jiffybox.net', type: 'get', id: 'ping1'})
					.c('ping', {xmlns: 'urn:xmpp:ping'});

>>>discovery info nachrichten
$iq({from: 'mike@j46760.servers.jiffybox.net', type: 'get', id: 'info'})
					.c('query', {xmlns: 'http://jabber.org/protocol/disco#info'})
					.up()
				.up();
*/
