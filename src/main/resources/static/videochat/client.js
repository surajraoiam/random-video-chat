//****** 
//UI selectors block 
//******
 
var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPage = document.querySelector('#callPage'); 
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#randomCallBtn'); 
var sendMessBtn = document.querySelector('#sendMessBtn'); 

var hangUpBtn = document.querySelector('#hangUpBtn');
  
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo'); 

var yourConn; 
var stream;
var dataChannel;
var input = document.getElementById("messageInput");
//our username 
var name; 
var connectedUser;

//connecting to our signaling server
var loc = window.location;
var conn = new WebSocket('wss://'+loc.hostname+':'+loc.port+'/socket');
  
conn.onopen = function () { 
	   console.log("Connected to the signaling server"); 
	   return login_user();
	};

	function login_user(){
		name = "s";
		
		   if (name.length > 0) { 
		      send({ 
		         type: "login", 
		         name: name 
		      }); 
		   }
	};
  
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
   var data = JSON.parse(msg.data); 
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         callBtn.style.display = "block"; 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate);
         callBtn.style.display = "none"; 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};
  

// Login when the user clicks the button 
//loginBtn.addEventListener("click", function (event) { 
//   name = usernameInput.value;
//	
//   if (name.length > 0) { 
//      send({ 
//         type: "login", 
//         name: name 
//      }); 
//   }
//	
//});
 
function handleLogin(success) { 
   if (success === false) { 
      alert("Ooops...try a different username"); 
   } else { 
      //loginPage.style.display = "none"; 
		
      //********************** 
      //Starting a peer connection 
      //********************** 
		
      //getting local video stream 
      navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) { 
         stream = myStream; 
			
       //displaying local video stream on the page 
         try {
        	 localVideo.srcObject = stream;
    	  } catch (error) {
    		  localVideo.src = window.URL.createObjectURL(stream);
    	  }	
         //using Google public stun server 
         var configuration = { 
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
         }; 
			
         yourConn = new RTCPeerConnection(configuration, {
             optional : [ {
                 RtpDataChannels : true
             } ]
         });
         // setup stream listening 
         yourConn.addStream(stream); 
			
         //when a remote user adds stream to the peer connection, we display it 
         yourConn.onaddstream = function (e) { 
            
            try {
            	remoteVideo.srcObject = e.stream;
       	  } catch (error) {
       		remoteVideo.src = window.URL.createObjectURL(e.stream);
       	  }	
         };
			
         // Setup ice handling 
         yourConn.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };  
         
      // creating data channel
         dataChannel = yourConn.createDataChannel("dataChannel", {
             reliable : true
         });
         dataChannel.onerror = function(error) {
             console.log("Error occured on datachannel:", error);
         };

         // when we receive a message from the other peer, printing it on the console
         dataChannel.onmessage = function(event) {
             console.log("message:", event.data);
             message = event.data;
             if($.trim(message) == '') {
         		return false;
         	}
         	$('<li class="sent"><img src="http://emilcarlsson.se/assets/mikeross.png" alt="" /><p>' + message + '</p></li>').appendTo($('.messages ul'));
         	$('.message-input input').val(null);
         	$('.contact.active .preview').html('<span>You: </span>' + message);
         	$(".messages").animate({ scrollTop: $(document).height() }, "fast");
         };

         dataChannel.onclose = function() {
             console.log("data channel is closed");
         };
			
      }, function (error) { 
         console.log(error); 
      }); 
		
   } 
};
  
//initiating a call 
callBtn.addEventListener("click", function () { 
   var callToUsername = callToUsernameInput.value;
	
   if (callToUsername.length > 0) { 
	
      connectedUser = callToUsername;
		
      // create an offer 
      yourConn.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });
		
   } 
   callBtn.style.display = "none"; 
   
});
  
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};
  
//when we got an answer from a remote user
function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};
   
//hang up 
hangUpBtn.addEventListener("click", function () { 

   send({ 
      type: "leave" 
   });  
	
   handleLeave(); 
});
  
function handleLeave() { 
   connectedUser = null; 
   remoteVideo.src = null; 
	
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};

function sendMessage() {
	sendMess = $('#messageInput').val();
    dataChannel.send(input.value);
    input.value = "";
    
    if($.trim(sendMess) == '') {
		return false;
	}
	$('<li class="replies"><img src="http://emilcarlsson.se/assets/harveyspecter.png" alt="" /><p>' + sendMess + '</p></li>').appendTo($('.messages ul'));
	$('.contact.active .preview').html('<span>You: </span>' + sendMess);
	$(".messages").animate({ scrollTop: $(document).height() }, "fast");
};
