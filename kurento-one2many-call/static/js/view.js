/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Lnsed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// var ws = new WebSocket('wss://' + location.host + '/one2many');

///// added lines 
//const express = require('express');
//const app = express();
//const http = require('http');
//const server = http.createServer(app);
//const { Server } = require("socket.io");
//const io = new Server(server);
///// til here






var video;
var webRtcPeer;
var autoView = true;
var room;
let cur_room;
window.onload = function() {
        console = new Console();
        video = document.getElementById('video');
        room = $('#current_room');
        // document.getElementById('call').addEventListener('click', function() { presenter(); } );
        document.getElementById('viewer').addEventListener('click', function(e) {viewer(); e.preventDefault();});
        document.getElementById('terminate').addEventListener('click', function() { stop(); } );
}


var socketio = io.connect();
socketio.on('connect', function() {
        socketio.emit('Init_joinRoom', prompt('Join room name: '));
});

socketio.on('currentRoom', function(data){
        cur_room = data;
        console.log('current room is ' + data);
        document.getElementById("current_room").innerHTML = "<p id = 'current_room'> Current Room: " + data + "</p>";
});

socketio.on("updateRooms_viewer", function(data){
    console.log('hi');
    console.log(data[0]);
    document.getElementById("all_rooms").innerHTML = "";
    document.getElementById("channels").innerHTML = "";

    for(let i = 0; i < data.length; i++) {
        console.log("list of rooms: " + data[i]);
        document.getElementById("all_rooms").innerHTML += '<button class = "listofRooms" onclick = "joinRoom(\''+data[i]+'\')"  id = ' + data[i] + '>' + data[i] + '</button>';
        let x = document.createElement("input");
        x.setAttribute("type", "checkbox");
        x.setAttribute("id", "merge_"+data[i]);
        x.setAttribute("value", data[i]);

        document.getElementById("channels").appendChild(x);
        

        // document.getElementById("channels").innerHTML += '<input type = "checkbox" id = ' + data[i] + ' value = ' + data[i] + '> <label for=' + data[i] + '>' + data[i] + '</label>'; 
    }
    document.getElementById('merge_button').innerHTML = '<button id = "merge_button1"> merge </button>';
//     document.getElementById('merge_button1').setAttribute('value', "merge");
//     document.getElementById('merge_button1').setAttribute('name', "merge name");

    document.getElementById('merge_button1').addEventListener('click', function(){

        mergeRoom(data);
    })

});



socketio.on('disconnect', function(){
	console.log('Disconnected from socket');
	dispose();
});

socketio.on('presenterResponse', function(data) {
	presenterResponse(data);
});

socketio.on('viewerResponse', function(data) {
	viewerResponse(data);
});

socketio.on('merged_viewerResponse', function(data) {
        console.log('MERGE RESPOND!');
	viewerMergedResponse(data);
});


socketio.on('stopCommunication', function(data) {
	console.log('stopCommunication');
	dispose();
});

socketio.on('iceCandidate', function(data) {
	webRtcPeer.addIceCandidate(data.candidate)
});

socketio.on('streamStarted', function(data) {
	if (autoView) {
		viewer();
	}
});

function joinRoom(rn) {
        console.log("ATTEMPT TO JOIN " + rn);
        socketio.emit("joinRoom_to_server", {
                roomname: rn
        });
}

function presenterResponse(message) {
        if (message.response != 'accepted') {
                var errorMsg = message.message ? message.message : 'Unknow error';
                console.warn('Call not accepted for the following reason: ' + errorMsg);
                dispose();
        } else {
                webRtcPeer.processAnswer(message.sdpAnswer);
        }
}

function viewerResponse(message) {
        console.log("VIEWER RESPONSE");
        if (message.response != 'accepted') {
                var errorMsg = message.message ? message.message : 'Unknow error';
                console.warn('Call not accepted for the following reason: ' + errorMsg);
                dispose();
        } else {
                webRtcPeer.processAnswer(message.sdpAnswer);
        }
}

function viewerMergedResponse(message) {
        console.log("MERGED VIEWER RESPONSE");
        if (message.response != 'accepted') {
                var errorMsg = message.message ? message.message : 'Unknow error';
                console.warn('Call not accepted for the following reason: ' + errorMsg);
                dispose();
        } else {
                console.log('response good');
                webRtcPeer.processAnswer(message.sdpAnswer, function(error){
                        if(error) return console.error(error);
                });
        }
}

function mergeRoom(data) {
        let x = document.getElementById('video');
        x.remove();
        let y = document.getElementById('viewer');
        y.remove();
        // <a id="viewer" href="#" class="btn btn-primary" value = "viewer">
        // <span class="glyphicon glyphicon-user"></span> Viewer</a>
        let z = document.createElement('a');
        document.getElementById('main_buttons').appendChild(z);
        z.innerHTML ='<a id = "merged_viewer_btn" href = "#" class = "btn btn-primary" value = "viewer"> <span class = "glyphicon glyphicon-user"></span> Viewer</a>'
        

        //collect the boxes that were checked and then make a new room that contians those data and streams those data
       let selected_rooms = [];
        for(let i = 0; i < data.length; i++){
                if(document.getElementById("merge_"+data[i]).checked){
                        selected_rooms.push(data[i]);
                        console.log('create extra vidoes');
                        let x = document.createElement('video');
                        // autoplay width="854px" height="480px" poster="img/webrtc.png"
                        x.setAttribute('id', 'vid_'+data[i]);
                        x.width = 854;
                        x.height = 480;
                        x.poster = 'img/webrtc.png';
                        document.getElementById('videoBig').appendChild(x);
                }
        }

        socketio.emit("join_MergeRoom", {
                selected_rooms: selected_rooms
        });
        console.log("SEL ROOMS " + selected_rooms);
        document.getElementById("merged_viewer_btn").addEventListener('click', function() {
                mergedViewer(data);
        });
}

function mergedViewer(data) {
        autoView = true;
                let video2 = document.getElementById('vid_r1');
                //console.log( ' MV ' +data[i]);
                // let video2 = document.getElementById("vid_r1");
                // console.log(video2.id);
                // console.log('VP' + video2.poster);
                //cur_room = data[i];
                if (!webRtcPeer) {
                        showSpinner(video2);
                        var options = {
                                remoteVideo: video2,
                                onicecandidate : onIceCandidate2
                        }
        
                        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
                                if(error) return console.error(error);
        
                                this.generateOffer(onOfferMergedViewer);
                        });
                }
        
}

function onOfferMergedViewer(error, offerSdp) {
        //console.log(cur_room);
        let c_room = "Merged Room";
        let access_room = "r1";
        if (error) return console.error(error);
    
            var message = {
                    sdpOffer : offerSdp,
                    c_room: c_room,
                    access_room: access_room
            }
            socketio.emit('merged_viewer', message);
}



function viewer() {
        console.log("I AM VIEWER");
        console.log(video.poster);
        autoView = true;
        if (!webRtcPeer) {
                showSpinner(video);

                

                var options = {
                        remoteVideo: video,
                        onicecandidate : onIceCandidate
                }

                webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
                        if(error) return console.error(error);

                        this.generateOffer(onOfferViewer);
                });
        }
}

function onOfferViewer(error, offerSdp) {
    console.log("onOfferViewer: "  + cur_room);

    if (error) return console.error(error);

        var message = {
                sdpOffer : offerSdp,
                // room: cur_room
        }
        socketio.emit('viewer', message);
    }

function onIceCandidate(candidate) {
	//  console.log('Local candidate' + JSON.stringify(candidate));
         socketio.emit('onIceCandidate', {candidate : candidate});
}

function onIceCandidate2(candidate) {
        console.log('Local candidate' + JSON.stringify(candidate));
        socketio.emit('onIceCandidate2', {candidate : candidate});
}

function stop() {
        autoView = false;
 if (webRtcPeer) {
		 var message = {
		        id : 'stop'
		 }
		 sendMessage(message);
		 dispose();
 }
}

function dispose() {
 if (webRtcPeer) {
		 webRtcPeer.dispose();
		 webRtcPeer = null;
 }
 hideSpinner(video);
}

function sendMessage(message) {
 var jsonMessage = JSON.stringify(message);
 console.log('Sending message: ' + jsonMessage);
//  ws.send(jsonMessage);
}

function showSpinner() {
 for (var i = 0; i < arguments.length; i++) {
		 arguments[i].poster = './img/transparent-1px.png';
		 arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
 }
}

function hideSpinner() {
 for (var i = 0; i < arguments.length; i++) {
		 arguments[i].src = '';
		 arguments[i].poster = './img/webrtc.png';
		 arguments[i].style.background = '';
 }
}

/**
* Lightbox utility (to display media pipeline image in a modal dialog)
*/
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});

