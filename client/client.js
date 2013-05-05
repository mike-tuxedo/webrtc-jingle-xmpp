'use strict'
var ws = null;
var presence = 'offline';

$(document).ready(function(){
  var allButtons = [$('#setPresence'), $('#createOffer'), $('#sendSDP'), $('#close')];
  WsConn.init();

  $('#connect').click(function(){
    var msg = JSON.stringify({subject: "connXMPP"});
    ws.send(msg);
  });

  $('#setPresence').click(function(){

    if(presence === 'offline'){
      $('#setPresence').text('set presence offline');
      presence = 'online';
      var msg = JSON.stringify({subject: "status", status: 'online'});
    }
    else{
      $('#setPresence').text('set presence online');
      presence = 'offline';
      var msg = JSON.stringify({subject: "status", status: 'offline'});
    }

    ws.send(msg);
    $('#createOffer').removeAttr('disabled').attr('class', 'hover');
  });

  $('#setRemoteJID').click(function(){
    var msg = JSON.stringify({subject: "setRemJID", jid: $('#remJID').val()});
    ws.send(msg);
  });

  $('#setLocalJID').click(function(){
    var msg = JSON.stringify({subject: "setLocJID", jid: $('#locJID').val()});
    ws.send(msg);
  });

  $('#subscribe').click(function(){
    var msg = JSON.stringify({subject: "subscribe"});
    ws.send(msg);
  });

  $('#subscribed').click(function(){
    var msg = JSON.stringify({subject: "subscribed"});
    ws.send(msg);
  });

  $('#unsubscribe').click(function(){
    var msg = JSON.stringify({subject: "unsubscribe"});
    ws.send(msg);
  });

  $('#createOffer').click(function(){
    createOffer();
    $('#sendSDP').removeAttr('disabled').attr('class', 'hover');
  });

  $('#sendSDP').click(function(){
    var msg = JSON.stringify({subject: "sdp", sdp: JSON.stringify(localDescription.sdp)});
    ws.send(msg);
  });

  $('#getDiscInfo').click(function(){
    var msg = JSON.stringify({subject: "getDig"});
    ws.send(msg);
  });

  $('#getDiscInfoToClient').click(function(){
    var msg = JSON.stringify({subject: "getDigOfClient"});
    ws.send(msg);
  });

  $('#getRoster').click(function(){
    var msg = JSON.stringify({subject: "getRoster"});
    ws.send(msg);
  });

  $('#close').click(function(){
    var msg = JSON.stringify({subject: "close"});
    ws.send(msg);

    allButtons.forEach(function(item){
      item.removeAttr('class').attr('disabled', 'disabled');
    });
  });

  $('#disconn').click(function(){
    var msg = JSON.stringify({subject: 'disconn'});
    ws.send(msg);
  });
});

/*var testStanza = "<content creator='initiator' name='audio'>";
  testStanza += "<description xmlns='urn:xmpp:jingle:apps:rtp:1' media='audio'>";
  testStanza += " <payload-type id='103' name='ISAC' clockrate='16000'/>";
  testStanza += " <payload-type id='104' name='ISAC'  clockrate='32000'/>";
  testStanza += " <payload-type id='111' name='opus' clockrate='48000' channels='2'>";
  testStanza += "   <parameter name='minptime' value='10'/>";
  testStanza += " </payload-type>";
  testStanza += " <payload-type id='0' name='PCMU' clockrate='8000'/>";
  testStanza += " <payload-type id='8' name='PCMA' clockrate='8000'/>";
  testStanza += " <payload-type id='107' name='CN' clockrate='48000'/>";
  testStanza += " <payload-type id='106' name='CN' clockrate='32000'/>";
  testStanza += " <payload-type id='105' name='CN' clockrate='16000'/>";
  testStanza += " <payload-type id='13' name='CN' clockrate='8000'/>";
  testStanza += " <payload-type id='126' name='telephone-event' clockrate='8000' maxptime='60'/>";
  testStanza += " <encryption required='1'>";
  testStanza += "   <crypto crypto-suite='AES_CM_128_HMAC_SHA1_80' key-params='inline:Sv26gl3hOiCJ0rxZ2wWHC2K+9UdE1oGZUenOmF/o' session-params='' tag='1'/>";
  testStanza += "   <crypto crypto-suite='AES_CM_128_HMAC_SHA1_32' key-params='inline:RHiVK5mn01CXzLnZiAa230KGJwwnaX2CY/ytjCqR' session-params='' tag='0'/>";
  testStanza += " </encryption>";
  testStanza += " <stream>";
  testStanza += " </stream>";
  testStanza += "</description>";
  testStanza += "<transport xmlns='urn:xmpp:jingle:transports:raw-udp:1' pwd='9JR7GZRZzYAHFkFmdG9DHADx' ufrag='TrbVa7ZyJ/HJNLyu'>";
    testStanza += "    <candidate generation='0' ip='10.0.0.3' port='54744' protocol='udp' type='host'/>";
    testStanza += "    <candidate generation='0' ip='88.117.115.117' port='52272' protocol='udp' type='srflx'/>";
    testStanza += "    <candidate generation='0' ip='10.0.0.3' port='58811' protocol='tcp' type='srflx'/>";
  testStanza += "</transport>";
  testStanza += "</content>";
  */