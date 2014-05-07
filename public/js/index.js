function init() {

  var serverBaseUrl = document.domain;

  /*
   On client init, try to connect to the socket.IO server.
   Note we don't specify a port since we set up our server
   to run on port 8080
  */
  var socket = io.connect(serverBaseUrl);

  //We'll save our session ID in a variable for later
  var sessionId = '';

  //update participants list

 function updateParticipants(participants) {
   $('#participants').html('');
   for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<span id="' + participants[i].id + '">' +
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
    }
  }

  /*
 When the client successfuly connects to the server, an
 event "connect" is emitted. Let's get the session ID and
 log it. And tell socket.IO theres a new user by emiting "newUser"
  */
  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    console.log('Connected ' + sessionId);
    socket.emit('newUser', {id: sessionId, name: $('#name').val()});
  });

  //for each new connection we update the participants list
  socket.on('newConnection', function(data) {
    updateParticipants(data.participants);
  });

  //on userDisconnect we update span/participant display
  socket.on('userdisconnected', function(data) {
    $('#' + data.id).remove();
  });

  //on nameChanged update span/participant display
  socket.on('nameChanged', function(data) {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
  });

  //on incomingMessage, we prepend to the messages section
  socket.on('incomingMessage', function(data) {
    var message = data.message;
    var name = data.name;
    $('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
  });
  //if unable to connect to server, log error
  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  //sendMessage ajax POST call to server with message from textarea
  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();
    $.ajax({
      url: '/message',
      type: 'POST',
      datatype: 'json',
      data: {message: outgoingMessage, name: name}
    });
  }

  //Map enter key to sendMessage if there is something in textarea
  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  //disables/enables Send button
  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
  }

  //tell server when user changes name
  function nameFocusOut() {
    var name = $('#name').val();
    socket.emit('nameChange', {id: sessionId, name: name});
  }

  /* Elements setup */
  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);
}

$(document).on('ready', init);
