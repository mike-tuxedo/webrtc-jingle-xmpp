var localOffer = null;
var remoteOffer = null;
var localStream = null;
var callback = null;
var pc = null;
var sid = null;
var farParty = 'jingle@j46760.servers.jiffybox.net';
var userId = 'mike@j46760.servers.jiffybox.net';
var interval = null;
var initiator = 'mike@j46760.servers.jiffybox.net';
var started = false;
var stunServer = null
var connection = null;
var callId = null;
var hidef = false;

var getJingle = function(strophe, sdp){
  var $iq = strophe.$iq;
  //TODO: parse sdp to jingle
  console.log("parsing SDP to JINGLE");

  //var action = this.initiator ? "session-initiate" : "session-accept";
  var action = "session-initiate";
  var sid        = getToken(sdp, "o=- ", " ");
  var ipaddr      = getToken(sdp, "c=IN IP4 ", "\r\n");
  var port        = getToken(sdp, "m=audio ", " ");
  var ufrag       = getToken(sdp, "a=ice-ufrag:", "\r\n");
  var passw       = getToken(sdp, "a=ice-pwd:", "\r\n");
  var crypto0     = getToken(sdp, "AES_CM_128_HMAC_SHA1_80 inline:", "\r\n");
  var crypto1     = getToken(sdp, "AES_CM_128_HMAC_SHA1_32 inline:", "\r\n");
  var ssrc        = getToken(sdp, "a=ssrc:", " ");
  var cname       = getToken(sdp, "a=ssrc:" + ssrc + " cname:", "\r\n");
  var mslabel     = getToken(sdp, "a=ssrc:" + ssrc + " mslabel:", "\r\n");
  var label       = getToken(sdp, "a=ssrc:" + ssrc + " label:", "\r\n");
  var fndtn       = getToken(sdp, "a=candidate:", " ");
  var prior       = getToken(sdp, "a=candidate:" + fndtn + " 1 udp ", " ");

  var iqStanza = $iq({to: farParty, type: 'set', id: sid})
          .c('jingle', {xmlns: 'urn:xmpp:jingle:1', action: action, initiator: userId, sid: sid })
            .c('content', {creator: 'initiator', name: 'audio'})
              .c('description', {xmls: 'urn:xmpp:jingle:apps:rtp:1', profile: 'RTP/SAVPF', media: 'audio'})
              (hidef) .c('payload-type', {id: '0', name: 'PCMU', clockrate: '8000'}).up()
              .c('encryption', {required: '1'})
                .c('crypto', {'crypto-suite': 'AES_CM_128_HMAC_SHA1_32', 'key-params': 'inline' + crypto2, 'session-params': 'KDR=0', tag: '0'}).up()
              .up()
              .c('streams')
                .c('stream', {cname: cname, mslabel: mslabel, label: label})
                  .c('ssrc').t(ssrc || '').up()
                .up()
              .up()
            .up()
            .c('transport', {xmlns: 'urn:xmpp:jingle:transports:raw-udp:1', pwd: passw, ufrag: ufrag})
              .c('candidate', {ip: ipaddr, port: port, generation: '0'}).up()
            .up()
          .up()
        .up();

  return iqStanza;
}

var getSDP = function(jingle){

  var DOMParser = require('xmldom').DOMParser;
  var parser = new DOMParser();
  var jingle = parser.parseFromString(jingle,"text/xml");

  console.log("parsing JINGLE to SDP: " + jingle);

  var ssrc = "2607505040";
  var ssrc_cname = "iirNX3Znb0iT+aow"
  var ssrc_mslabel = "fAy0FNrYIDVfeRwX5X0IK5TOCVTNJOXt4Cdb";
  var ssrc_label = "fAy0FNrYIDVfeRwX5X0IK5TOCVTNJOXt4Cdb00";

  var candidate_foundation = "1001321590";
  var candidate_priority = "2130714367";

  var ice_ufrag = "wZPq/BJNlo0K6ej5";
  var ice_pwd = "hLaFhH8Yfl+XeExexulHT42o";
  
  var payload_id = "0";
  var payload_name = "PCMU";
  var payload_clockrate = "8000";
  
//  var crypto = jingle.getElementsByTagName("crypto")[0];
  var payload = jingle.getElementsByTagName("payload-type")[0];
//  var stream = jingle.getElementsByTagName("stream")[0];
  var candidate = jingle.getElementsByTagName("candidate")[0];
  var transport = jingle.getElementsByTagName("transport")[0];

  if (payload != null)
  {
          payload_id = payload.getAttribute("id");
          payload_name = payload.getAttribute("name");
          payload_clockrate = payload.getAttribute("clockrate");  
          
          if (payload_clockrate == "32000") hidef = true;
  }

  if (transport.getAttribute("ufrag") != null)
  {
          ice_ufrag = transport.getAttribute("ufrag");
          ice_pwd = transport.getAttribute("pwd");
  }

  var sdp = "";

  sdp += "v=0\r\n";
  sdp += "o=- " + sid + " 1 IN IP4 127.0.0.1\r\n";
  sdp += "s=canary\r\n";
  sdp += "t=0 0\r\n";
  sdp += "a=group:BUNDLE audio\r\n";
  sdp += "m=audio " + candidate.getAttribute("port") + " RTP/SAVPF " + payload_id + "\r\n";
  sdp += "c=IN IP4 " + candidate.getAttribute("ip") + "\r\n";
  sdp += "a=rtcp:" + candidate.getAttribute("port") + " IN IP4 " + candidate.getAttribute("ip") + "\r\n";
  sdp += "a=candidate:" + candidate_foundation + " 1 udp " + candidate_priority + " " + candidate.getAttribute("ip") + " " + candidate.getAttribute("port") + " typ host generation 0\r\n";
  sdp += "a=ice-ufrag:" + ice_ufrag + "\r\n";
  sdp += "a=ice-pwd:" + ice_pwd + "\r\n";
  sdp += "a=sendrecv\r\n";
  sdp += "a=mid:audio\r\n";
  sdp += "a=rtcp-mux\r\n";
  //sdp += "a=crypto:" + crypto.getAttribute("tag") + " " + crypto.getAttribute("crypto-suite") + " " + crypto.getAttribute("key-params") + "\r\n";
  sdp += "a=rtpmap:" + payload_id + " " + payload_name + "/" + payload_clockrate + "\r\n";        
  sdp += "a=ssrc:" + ssrc + " cname:" + ssrc_cname + "\r\n";
  sdp += "a=ssrc:" + ssrc + " mslabel:" + ssrc_mslabel + "\r\n";
  sdp += "a=ssrc:" + ssrc + " label:" + ssrc_label + "\r\n";

  console.log('REMOTE SDP' + sdp);
  return sdp;
}

var getToken = function(sdp, token, delim){
        var pos = sdp.indexOf(token);
        var para = null;

        if (pos > -1)
        {
                var para = sdp.substring(pos + token.length);

                if (para.indexOf(delim) > -1)
                {
                        para = para.substring(0, para.indexOf(delim));

                } else {

                        para = para.substring(0, para.indexOf("\r\n"));
                }

                para = para.trim();
        }

        return para;
}

exports.getJingle = getJingle;
exports.getSDP = getSDP;