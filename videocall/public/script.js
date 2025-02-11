// const socket = io("/"); 
// const chatInputBox = document.getElementById("chat_message");
// const all_messages = document.getElementById("all_messages");
// const leave_meeting = document.getElementById("leave-meeting");
// const main__chat__window = document.getElementById("main__chat__window"),
//     videoGrid = document.getElementById("video-grid"),
//     myVideo = document.createElement("video");
// myVideo.muted = true;

// var peer = new Peer({
//     config: {
//         iceServers: [
//             {
//                 url: "turn:numb.viagenie.ca",
//                 credential: "muazkh",
//                 username: "webrtc@live.com",
//             },
//             {
//                 url: "turn:192.158.29.39:3478?transport=udp",
//                 credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
//                 username: "28224511:1379330808",
//             },
//             {
//                 url: "turn:turn.bistri.com:80",
//                 credential: "homeo",
//                 username: "homeo",
//             },
//             {
//                 url: "turn:turn.anyfirewall.com:443?transport=tcp",
//                 credential: "webrtc",
//                 username: "webrtc",
//             },
//             {
//                 url: ["turn:13.250.13.83:3478?transport=udp"],
//                 username: "YzYNCouZM1mhqhmseWk6",
//                 credential: "YzYNCouZM1mhqhmseWk6",
//             },
//         ],
//     },
// });

// let myVideoStream;
// let currentUserId;
// let pendingMsg = 0;
// let peers = {};
// var getUserMedia =
//     navigator.getUserMedia ||
//     navigator.webkitGetUserMedia ||
//     navigator.mozGetUserMedia;

// navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) => {
//     myVideoStream = stream;
//     addVideoStream(myVideo, stream, "me");

//     peer.on("call", (call) => {
//         call.answer(stream);

//         const video = document.createElement("video");
//         call.on("stream", (userVideoStream) => {
//             const userId = call.peer; // Peer ID corresponds to the user ID
//             addVideoStream(video, userVideoStream, userId);
//         });
//     });

//     socket.on("user-connected", (userId) => {
//         connectToNewUser(userId, stream);
//     });

//     socket.on("user-disconnected", (userId) => {
//         if (peers[userId]) peers[userId].close();
//         speakText(`User ${userId} left`);
//     });

//     document.addEventListener("keydown", (e) => {
//         if (e.which === 13 && chatInputBox.value != "") {
//             socket.emit("message", chatInputBox.value);
//             chatInputBox.value = "";
//         }
//     });

//     document.getElementById("sendMsg").addEventListener("click", () => {
//         if (chatInputBox.value != "") {
//             socket.emit("message", chatInputBox.value);
//             chatInputBox.value = "";
//         }
//     });

//     chatInputBox.addEventListener("focus", () => {
//         document.getElementById("chat__Btn").classList.remove("has__new");
//         pendingMsg = 0;
//         document.getElementById("chat__Btn").children[1].innerHTML = `Chat`;
//     });

//     // Display messages received from the server
//     socket.on("createMessage", (message) => {
//         let li = document.createElement("li");
//         if (message.user !== currentUserId) {
//             li.classList.add("otherUser");
//             li.innerHTML = `<div><b>User (${message.user}): </b>${message.msg}</div>`;
//         } else {
//             li.innerHTML = `<div><b>Me:</b> ${message.msg}</div>`;
//         }

//         all_messages.append(li);
//         main__chat__window.scrollTop = main__chat__window.scrollHeight;

//         if (message.user !== currentUserId) {
//             pendingMsg++;
//             playChatSound();
//             document.getElementById("chat__Btn").classList.add("has__new");
//             document.getElementById("chat__Btn").children[1].innerHTML = `Chat (${pendingMsg})`;
//         }
//     });
// });

// peer.on("open", (id) => {
//     currentUserId = id;
//     socket.emit("join-room", ROOM_ID, id);
//     socket.emit("user-action", { action: "join", userId: currentUserId }); // Notify server
//     updateUserStatus (userId, action);
// });

// socket.on("disconnect", () => {
//     socket.emit("leave-room", ROOM_ID, currentUserId);
//     socket.emit("user-action", { action: "leave", userId: currentUserId }); // Notify server
//     updateUserStatus(userId, action);
// });

// const connectToNewUser = (userId, stream) => {
//     const call = peer.call(userId, stream);
//     const video = document.createElement("video");

//     call.on("stream", (userVideoStream) => {
//         addVideoStream(video, userVideoStream, userId);
//     });

//     call.on("close", () => {
//         const userContainer = document.getElementById(`container-${userId}`);
//         if (userContainer) userContainer.remove();
//         delete activeUsers[userId];
//         updateVideoLayout();
//     });

//     peers[userId] = call;
// };

// const playStop = () => {
//     let enabled = myVideoStream.getVideoTracks()[0].enabled;
//     if (enabled) {
//         myVideoStream.getVideoTracks()[0].enabled = false;
//         setPlayVideo();
//         socket.emit("user-action", { action: "pause-video", userId: currentUserId }); // Notify server
//         updateUserStatus(currentUserId, "pause-video");
//     } else {
//         setStopVideo();
//         myVideoStream.getVideoTracks()[0].enabled = true;
//         socket.emit("user-action", { action: "play-video", userId: currentUserId }); // Notify server
//         updateUserStatus(currentUserId, "play-video");
//     }
// };

// const muteUnmute = () => {
//     const enabled = myVideoStream.getAudioTracks()[0].enabled;
//     if (enabled) {
//         myVideoStream.getAudioTracks()[0].enabled = false;
//         setUnmuteButton();
//         socket.emit("user-action", { action: "mute", userId: currentUserId }); // Notify server
//         updateUserStatus(currentUserId, "mute");
//     } else {
//         myVideoStream.getAudioTracks()[0].enabled = true;
//         setMuteButton();
//         socket.emit("user-action", { action: "unmute", userId: currentUserId }); // Notify server
//         updateUserStatus(currentUserId, "unmute");
//     }
// };

// const activeUsers = {}; // To store active users and their corresponding containers

// const addVideoStream = (videoE1, stream, uId = "") => {
//     // Check if a container for this user already exists
//     let existingContainer = document.getElementById(`container-${uId}`);
//     if (!existingContainer) {
//         // Create a new container for the video and user ID
//         const videoContainer = document.createElement("div");
//         videoContainer.classList.add("video-container");
//         videoContainer.id = `container-${uId}`;

//         const userIdLabel = document.createElement("p");
//         userIdLabel.classList.add("user-id-label");
//         userIdLabel.innerText = uId ? `${uId}` : "Me";

//         videoContainer.append(videoE1, userIdLabel);
//         videoGrid.append(videoContainer);
//     }

//     // Ensure the video element is added and stream is set
//     videoE1.srcObject = stream;
//     videoE1.id = uId;
//     videoE1.addEventListener("loadedmetadata", () => {
//         videoE1.play();
//     });

//     activeUsers[uId] = stream; // Save the stream for this user
//     updateVideoLayout();
// };

// const updateVideoLayout = () => {
//     let totalUsers = Object.keys(activeUsers).length;
//     const videoContainers = document.getElementsByClassName("video-container");
//     for (let index = 0; index < videoContainers.length; index++) {
//         videoContainers[index].style.width = 100 / totalUsers + "%";
//     }
// };

// const setStopVideo = () => {
//     const html = `<i class="fa fa-video"></i>
//     <span>Pause Video</span>`;
//     document.getElementById("playPauseVideo").innerHTML = html;
// };

// const setPlayVideo = () => {
//     const html = `<i class="fa fa-video-slash"></i>
//     <span>Play Video</span>`;
//     document.getElementById("playPauseVideo").innerHTML = html;
// };

// const setUnmuteButton = () => {
//     const html = `<i class="fa fa-microphone-slash"></i><span class="unmute">Unmute</span>`;
//     document.getElementById("muteButton").innerHTML = html;
// };

// const setMuteButton = () => {
//     const html = `<i class="fa fa-microphone"></i><span>Mute</span>`;
//     document.getElementById("muteButton").innerHTML = html;
// };

// const ShowChat = (e) => {
//     e.classList.toggle("active");
//     document.body.classList.toggle("showChat");
// };

// const showInvitePopup = () => {
//     const roomLink = `${window.location.origin}/${ROOM_ID}`;
//     document.getElementById("roomLink").value = roomLink;
//     document.querySelector('.invitePop').style.display = 'block';
//     document.querySelector('.overlay').style.display = 'block';
// };

// const hideInvitePopup = () => {
//     document.querySelector('.invitePop').style.display = 'none';
//     document.querySelector('.overlay').style.display = 'none';
// };

// const copyToClipboard = () => {
//     var copyText = document.getElementById("roomLink");
//     copyText.select();
//     copyText.setSelectionRange(0, 99999);
//     document.execCommand("copy");
//     alert("Room ID has been copied to clipboard!");
//     hideInvitePopup();
// };

// const playChatSound = () => {
//     const chatAudio = document.getElementById("chatAudio");
//     chatAudio.play();
// };

// const speakText = (msgTxt) => {
//     const audio = new SpeechSynthesisUtterance();
//     audio.text = msgTxt;
//     window.speechSynthesis.speak(audio);
// };



// // Notification Section
// const notificationSection = document.getElementById('notificationSection');
// const notificationList = document.getElementById('notificationList');

// // Handle the notifications section visibility toggle
// const toggleNotifications = () => {
//     const notificationSection = document.querySelector('.notification-section');
//     notificationSection.classList.toggle('show'); // Toggles visibility using the 'show' class
//     document.body.classList.toggle('showNotifications'); // Optional: For any additional layout changes
// };

// document.getElementById('notification__Btn').addEventListener('click', toggleNotifications);

// // Handle UI update for user action (mute/unmute, play/pause video)
// const updateUserStatus = (userId, action) => {
//     let notificationText = '';

//     switch(action) {
//         case 'join':
//             notificationText = `User ${userId} joined the call.`;
//             break;
//         case 'leave':
//             notificationText = `User ${userId} left the call.`;
//             break;
//         case 'mute':
//             notificationText = `User ${userId} muted their microphone.`;
//             break;
//         case 'unmute':
//             notificationText = `User ${userId} unmuted their microphone.`;
//             break;
//         case 'pause-video':
//             notificationText = `User ${userId} paused their video.`;
//             break;
//         case 'play-video':
//             notificationText = `User ${userId} resumed their video.`;
//             break;
//     }

//     // Check if a similar notification is already there (optional)
//     if (!document.querySelector(`#notification-${userId}-${action}`)) {
//         let notification = document.createElement("div");
//         notification.classList.add("notification");
//         notification.id = `notification-${userId}-${action}`; // Unique ID for each notification
//         notification.textContent = notificationText;
//         document.getElementById('notificationList').appendChild(notification);
//     }
// };

// // Client-side socket event listener
// socket.on("user-action-notification", (data) => {
//     const { action, userId } = data;
//     console.log(`Notification received: User ${userId} performed action: ${action}`);
//     updateUserStatus(userId, action);
// });



// const socket = io("/"); 
// const chatInputBox = document.getElementById("chat_message");
// const all_messages = document.getElementById("all_messages");
// const leave_meeting = document.getElementById("leave-meeting");
// const main__chat__window = document.getElementById("main__chat__window"),
//     videoGrid = document.getElementById("video-grid"),
//     myVideo = document.createElement("video");
// myVideo.muted = true;

// var peer = new Peer({
//     config: {
//         iceServers: [
//             {
//                 url: "turn:numb.viagenie.ca",
//                 credential: "muazkh",
//                 username: "webrtc@live.com",
//             },
//             {
//                 url: "turn:192.158.29.39:3478?transport=udp",
//                 credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
//                 username: "28224511:1379330808",
//             },
//             {
//                 url: "turn:turn.bistri.com:80",
//                 credential: "homeo",
//                 username: "homeo",
//             },
//             {
//                 url: "turn:turn.anyfirewall.com:443?transport=tcp",
//                 credential: "webrtc",
//                 username: "webrtc",
//             },
//             {
//                 url: ["turn:13.250.13.83:3478?transport=udp"],
//                 username: "YzYNCouZM1mhqhmseWk6",
//                 credential: "YzYNCouZM1mhqhmseWk6",
//             },
//         ],
//     },
// });

// let myVideoStream;
// let currentUserId;
// let pendingMsg = 0;
// let peers = {};
// var getUserMedia =
//     navigator.getUserMedia ||
//     navigator.webkitGetUserMedia ||
//     navigator.mozGetUserMedia;

// navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) => {
//     myVideoStream = stream;
//     addVideoStream(myVideo, stream, "me");

//     peer.on("call", (call) => {
//         call.answer(stream);

//         const video = document.createElement("video");
//         call.on("stream", (userVideoStream) => {
//             const userId = call.peer; // Peer ID corresponds to the user ID
//             addVideoStream(video, userVideoStream, userId);
//         });
//     });

//     socket.on("user-connected", (userId) => {
//         connectToNewUser(userId, stream);
//     });

//     socket.on("user-disconnected", (userId) => {
//         if (peers[userId]) peers[userId].close();
//         speakText(`User ${userId} left`);
//     });

//     document.addEventListener("keydown", (e) => {
//         if (e.which === 13 && chatInputBox.value != "") {
//             socket.emit("message", chatInputBox.value);
//             chatInputBox.value = "";
//         }
//     });

//     document.getElementById("sendMsg").addEventListener("click", () => {
//         if (chatInputBox.value != "") {
//             socket.emit("message", chatInputBox.value);
//             chatInputBox.value = "";
//         }
//     });

//     chatInputBox.addEventListener("focus", () => {
//         document.getElementById("chat__Btn").classList.remove("has__new");
//         pendingMsg = 0;
//         document.getElementById("chat__Btn").children[1].innerHTML = `Chat`;
//     });

//     // Display messages received from the server
//     socket.on("createMessage", (message) => {
//         let li = document.createElement("li");
//         if (message.user !== currentUserId) {
//             li.classList.add("otherUser");
//             li.innerHTML = `<div><b>User (${message.user}): </b>${message.msg}</div>`;
//         } else {
//             li.innerHTML = `<div><b>Me:</b> ${message.msg}</div>`;
//         }

//         all_messages.append(li);
//         main__chat__window.scrollTop = main__chat__window.scrollHeight;

//         if (message.user !== currentUserId) {
//             pendingMsg++;
//             playChatSound();
//             document.getElementById("chat__Btn").classList.add("has__new");
//             document.getElementById("chat__Btn").children[1].innerHTML = `Chat (${pendingMsg})`;
//         }
//     });
// });

// peer.on("open", (id) => {
//     currentUserId = id;
//     socket.emit("join-room", ROOM_ID, id);
//     socket.emit("user-action", { action: "join", userId: currentUserId }); // Notify server
//     updateUserStatus (userId, action);
// });

// socket.on("disconnect", () => {
//     socket.emit("leave-room", ROOM_ID, currentUserId);
//     socket.emit("user-action", { action: "leave", userId: currentUserId }); // Notify server
//     updateUserStatus(userId, action);
// });

// const connectToNewUser = (userId, stream) => {
//     const call = peer.call(userId, stream);
//     const video = document.createElement("video");

//     call.on("stream", (userVideoStream) => {
//         addVideoStream(video, userVideoStream, userId);
//     });

//     call.on("close", () => {
//         const userContainer = document.getElementById(`container-${userId}`);
//         if (userContainer) userContainer.remove();
//         delete activeUsers[userId];
//         updateVideoLayout();
//     });

//     peers[userId] = call;
// };

// const playStop = () => {
//     let enabled = myVideoStream.getVideoTracks()[0].enabled;
//     if (enabled) {
//         myVideoStream.getVideoTracks()[0].enabled = false;
//         setPlayVideo();
//         socket.emit("user-action", { action: "pause-video", userId: currentUserId }); // Notify server
//     } else {
//         setStopVideo();
//         myVideoStream.getVideoTracks()[0].enabled = true;
//         socket.emit("user-action", { action: "play-video", userId: currentUserId }); // Notify server
//     }
// };

// const muteUnmute = () => {
//     const enabled = myVideoStream.getAudioTracks()[0].enabled;
//     if (enabled) {
//         myVideoStream.getAudioTracks()[0].enabled = false;
//         setUnmuteButton();
//         socket.emit("user-action", { action: "mute", userId: currentUserId }); // Notify server
//         addIcons(currentUserId, "mute");
//     } else {
//         myVideoStream.getAudioTracks()[0].enabled = true;
//         setMuteButton();
//         socket.emit("user-action", { action: "unmute", userId: currentUserId }); // Notify server
//     }
// };

// const activeUsers = {}; // To store active users and their corresponding containers

// const addVideoStream = (videoE1, stream, uId = "") => {
//     // Check if a container for this user already exists
//     let existingContainer = document.getElementById(`container-${uId}`);
//     if (!existingContainer) {
//         // Create a new container for the video and user ID
//         const videoContainer = document.createElement("div");
//         videoContainer.classList.add("video-container");
//         videoContainer.id = `container-${uId}`;

//         const userIdLabel = document.createElement("p");
//         userIdLabel.classList.add("user-id-label");
//         userIdLabel.innerText = uId ? `${uId}` : "Me";

//         const videoMute = document.createElement("p");
//         videoMute.classList.add("video-mute");
//         videoMute.innerText = "Video Muted";

//         videoContainer.append(videoE1, userIdLabel,videoMute);
//         videoGrid.append(videoContainer);
//     }

//     // Ensure the video element is added and stream is set
//     videoE1.srcObject = stream;
//     videoE1.id = uId;
//     videoE1.addEventListener("loadedmetadata", () => {
//         videoE1.play();
//     });

//     activeUsers[uId] = stream; // Save the stream for this user
//     updateVideoLayout();
// };

// const updateVideoLayout = () => {
//     let totalUsers = Object.keys(activeUsers).length;
//     const videoContainers = document.getElementsByClassName("video-container");
//     for (let index = 0; index < videoContainers.length; index++) {
//         videoContainers[index].style.width = 100 / totalUsers + "%";
//     }
// };

// const setStopVideo = () => {
//     const html = `<i class="fa fa-video"></i>
//     <span>Pause Video</span>`;
//     document.getElementById("playPauseVideo").innerHTML = html;
//     const muteElement = document.querySelector('#video-grid .video-mute');
//     if (muteElement) {
//         muteElement.style.display = 'none';
//     }
// };

// const setPlayVideo = () => {
//     const html = `<i class="fa fa-video-slash"></i>
//     <span>Play Video</span>`;
//     document.getElementById("playPauseVideo").innerHTML = html;
//     const muteElement = document.querySelector('#video-grid .video-mute');
//     if (muteElement) {
//         muteElement.style.display = 'block';
//     }
// };

// const setUnmuteButton = () => {
//     const html = `<i class="fa fa-microphone-slash"></i><span class="unmute">Unmute</span>`;
//     document.getElementById("muteButton").innerHTML = html;
// };

// const setMuteButton = () => {
//     const html = `<i class="fa fa-microphone"></i><span>Mute</span>`;
//     document.getElementById("muteButton").innerHTML = html;
// };

// const ShowChat = (e) => {
//     e.classList.toggle("active");
//     document.body.classList.toggle("showChat");
// };

// const showInvitePopup = () => {
//     const roomLink = `${window.location.origin}/${ROOM_ID}`;
//     document.getElementById("roomLink").value = roomLink;
//     document.querySelector('.invitePop').style.display = 'block';
//     document.querySelector('.overlay').style.display = 'block';
// };

// const hideInvitePopup = () => {
//     document.querySelector('.invitePop').style.display = 'none';
//     document.querySelector('.overlay').style.display = 'none';
// };

// const copyToClipboard = () => {
//     var copyText = document.getElementById("roomLink");
//     copyText.select();
//     copyText.setSelectionRange(0, 99999);
//     document.execCommand("copy");
//     alert("Room ID has been copied to clipboard!");
//     hideInvitePopup();
// };

// const playChatSound = () => {
//     const chatAudio = document.getElementById("chatAudio");
//     chatAudio.play();
// };

// const speakText = (msgTxt) => {
//     const audio = new SpeechSynthesisUtterance();
//     audio.text = msgTxt;
//     window.speechSynthesis.speak(audio);
// };



// // Notification Section
// const notificationSection = document.getElementById('notificationSection');
// const notificationList = document.getElementById('notificationList');

// // Handle the notifications section visibility toggle
// const toggleNotifications = () => {
//     const notificationSection = document.querySelector('.notification-section');
//     notificationSection.classList.toggle('show'); // Toggles visibility using the 'show' class
//     document.body.classList.toggle('showNotifications'); // Optional: For any additional layout changes
// };

// document.getElementById('notification__Btn').addEventListener('click', toggleNotifications);

// // Handle UI update for user action (mute/unmute, play/pause video)
// const updateUserStatus = (userId, action) => {
//     let notificationText = '';

//     // Define notification text based on the action
//     switch (action) {
//         case 'join':
//             notificationText = `User ${userId} joined the call.`;
//             break;
//         case 'leave':
//             notificationText = `User ${userId} left the call.`;
//             break;
//         case 'mute':
//             notificationText = `User ${userId} muted their microphone.`;
//             break;
//         case 'unmute':
//             notificationText = `User ${userId} unmuted their microphone.`;
//             break;
//         case 'pause-video':
//             notificationText = `User ${userId} paused their video.`;
//             break;
//         case 'play-video':
//             notificationText = `User ${userId} resumed their video.`;
//             break;
//     }

//     // Create a new notification element
//     let notification = document.createElement("div");
//     notification.classList.add("notification");
//     notification.textContent = notificationText;

//     // Append the new notification to the list
//     document.getElementById('notificationList').appendChild(notification);
// };


// // Client-side socket event listener
// socket.on("user-action-notification", (data) => {
//     const { action, userId } = data;
//     console.log(`Notification received: User ${userId} performed action: ${action}`);
//     updateUserStatus(userId, action);  
// });
















const socket = io("/"); 
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const leave_meeting = document.getElementById("leave-meeting");
const main__chat__window = document.getElementById("main__chat__window"),
    videoGrid = document.getElementById("video-grid"),
    myVideo = document.createElement("video");
myVideo.muted = true;

var peer = new Peer({
    config: {
        iceServers: [
            {
                url: "turn:numb.viagenie.ca",
                credential: "muazkh",
                username: "webrtc@live.com",
            },
            {
                url: "turn:192.158.29.39:3478?transport=udp",
                credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                username: "28224511:1379330808",
            },
            {
                url: "turn:turn.bistri.com:80",
                credential: "homeo",
                username: "homeo",
            },
            {
                url: "turn:turn.anyfirewall.com:443?transport=tcp",
                credential: "webrtc",
                username: "webrtc",
            },
            {
                url: ["turn:13.250.13.83:3478?transport=udp"],
                username: "YzYNCouZM1mhqhmseWk6",
                credential: "YzYNCouZM1mhqhmseWk6",
            },
        ],
    },
});

let myVideoStream;
let currentUserId;
let pendingMsg = 0;
let peers = {};
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "me");

    peer.on("call", (call) => {
        call.answer(stream);

        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
            const userId = call.peer; // Peer ID corresponds to the user ID
            addVideoStream(video, userVideoStream, userId);
        });
    });

    socket.on("user-connected", (userId) => {
        connectToNewUser(userId, stream);
    });

    socket.on("user-disconnected", (userId) => {
        if (peers[userId]) peers[userId].close();
        speakText(`User ${userId} left`);
    });

    document.addEventListener("keydown", (e) => {
        if (e.which === 13 && chatInputBox.value != "") {
            socket.emit("message", chatInputBox.value);
            chatInputBox.value = "";
        }
    });

    document.getElementById("sendMsg").addEventListener("click", () => {
        if (chatInputBox.value != "") {
            socket.emit("message", chatInputBox.value);
            chatInputBox.value = "";
        }
    });

    chatInputBox.addEventListener("focus", () => {
        document.getElementById("chat__Btn").classList.remove("has__new");
        pendingMsg = 0;
        document.getElementById("chat__Btn").children[1].innerHTML = `Chat`;
    });

    // Display messages received from the server
    socket.on("createMessage", (message) => {
        let li = document.createElement("li");
        if (message.user !== currentUserId) {
            li.classList.add("otherUser");
            li.innerHTML = `<div><b>User (${message.user}): </b>${message.msg}</div>`;
        } else {
            li.innerHTML = `<div><b>Me:</b> ${message.msg}</div>`;
        }

        all_messages.append(li);
        main__chat__window.scrollTop = main__chat__window.scrollHeight;

        if (message.user !== currentUserId) {
            pendingMsg++;
            playChatSound();
            document.getElementById("chat__Btn").classList.add("has__new");
            document.getElementById("chat__Btn").children[1].innerHTML = `Chat (${pendingMsg})`;
        }
    });
});

peer.on("open", (id) => {
    currentUserId = id;
    socket.emit("join-room", ROOM_ID, id);
    socket.emit("user-action", { action: "join", userId: currentUserId }); // Notify server
    updateUserStatus (userId, action);
});

socket.on("disconnect", () => {
    socket.emit("leave-room", ROOM_ID, currentUserId);
    socket.emit("user-action", { action: "leave", userId: currentUserId }); // Notify server
    updateUserStatus(userId, action);
});

const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, userId);
    });

    call.on("close", () => {
        const userContainer = document.getElementById(`container-${userId}`);
        if (userContainer) userContainer.remove();
        delete activeUsers[userId];
        updateVideoLayout();
    });

    peers[userId] = call;
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo(currentUserId);
        socket.emit("user-action", { action: "pause-video", userId: currentUserId }); // Notify server
    } else {
        setStopVideo(currentUserId);
        myVideoStream.getVideoTracks()[0].enabled = true;
        socket.emit("user-action", { action: "play-video", userId: currentUserId }); // Notify server
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
        socket.emit("user-action", { action: "mute", userId: currentUserId }); // Notify server
        addIcons(currentUserId, "mute");
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
        socket.emit("user-action", { action: "unmute", userId: currentUserId }); // Notify server
    }
};

const activeUsers = {}; // To store active users and their corresponding containers

const addVideoStream = (videoE1, stream, uId = "") => {
    // Check if a container for this user already exists
    let existingContainer = document.getElementById(`container-${uId}`);
    if (!existingContainer) {
        // Create a new container for the video and user ID
        const videoContainer = document.createElement("div");
        videoContainer.classList.add("video-container");
        videoContainer.id = `container-${uId}`;

        const userIdLabel = document.createElement("p");
        userIdLabel.classList.add("user-id-label");
        userIdLabel.innerText = uId ? `${uId}` : "Me";

        const videoMute = document.createElement("p");
        videoMute.classList.add("video-mute");
        videoMute.innerText = "⏸";

        const audioMute = document.createElement("p");
        audioMute.classList.add("audio-mute");
        audioMute.innerText = "U+1F507";

        videoContainer.append(videoE1, userIdLabel,videoMute, audioMute);
        videoGrid.append(videoContainer);
    }

    // Ensure the video element is added and stream is set
    videoE1.srcObject = stream;
    videoE1.id = uId;
    videoE1.addEventListener("loadedmetadata", () => {
        videoE1.play();
    });

    activeUsers[uId] = stream; // Save the stream for this user
    updateVideoLayout();
};

const updateVideoLayout = () => {
    let totalUsers = Object.keys(activeUsers).length;
    const videoContainers = document.getElementsByClassName("video-container");
    for (let index = 0; index < videoContainers.length; index++) {
        videoContainers[index].style.width = 100 / totalUsers + "%";
    }
};

const setStopVideo = (uId) => {
    const html = `<i class="fa fa-video"></i>
    <span>Pause Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;

    const muteElement = document.querySelector(`#container-${uId} .video-mute`);
    if (muteElement) {
        muteElement.style.display = 'none';
    }

    // Emit 'playVideo' event to the server
    socket.emit('playVideo', { userId: uId });
};

const setPlayVideo = (uId) => {
    const html = `<i class="fa fa-video-slash"></i>
    <span>Play Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;

    const muteElement = document.querySelector(`#container-${uId} .video-mute`);
    if (muteElement) {
        muteElement.style.display = 'block';
    }

    // Emit 'pauseVideo' event to the server
    socket.emit('pauseVideo', { userId: uId });
};

const setUnmuteButton = () => {
    const html = `<i class="fa fa-microphone-slash"></i><span class="unmute">Unmute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i><span>Mute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const ShowChat = (e) => {
    e.classList.toggle("active");
    document.body.classList.toggle("showChat");
};

const showInvitePopup = () => {
    const roomLink = `${window.location.origin}/${ROOM_ID}`;
    document.getElementById("roomLink").value = roomLink;
    document.querySelector('.invitePop').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
};

const hideInvitePopup = () => {
    document.querySelector('.invitePop').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
};

const copyToClipboard = () => {
    var copyText = document.getElementById("roomLink");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("Room ID has been copied to clipboard!");
    hideInvitePopup();
};

const playChatSound = () => {
    const chatAudio = document.getElementById("chatAudio");
    chatAudio.play();
};

const speakText = (msgTxt) => {
    const audio = new SpeechSynthesisUtterance();
    audio.text = msgTxt;
    window.speechSynthesis.speak(audio);
};



// Notification Section
const notificationSection = document.getElementById('notificationSection');
const notificationList = document.getElementById('notificationList');

// Handle the notifications section visibility toggle
const toggleNotifications = () => {
    const notificationSection = document.querySelector('.notification-section');
    notificationSection.classList.toggle('show'); // Toggles visibility using the 'show' class
    document.body.classList.toggle('showNotifications'); // Optional: For any additional layout changes
};

document.getElementById('notification__Btn').addEventListener('click', toggleNotifications);

// Handle UI update for user action (mute/unmute, play/pause video)
const updateUserStatus = (userId, action) => {
    let notificationText = '';

    // Define notification text based on the action
    switch (action) {
        case 'join':
            notificationText = `User ${userId} joined the call.`;
            break;
        case 'leave':
            notificationText = `User ${userId} left the call.`;
            break;
        case 'mute':
            notificationText = `User ${userId} muted their microphone.`;
            break;
        case 'unmute':
            notificationText = `User ${userId} unmuted their microphone.`;
            break;
        case 'pause-video':
            notificationText = `User ${userId} paused their video.`;
            break;
        case 'play-video':
            notificationText = `User ${userId} resumed their video.`;
            break;
    }

    // Create a new notification element
    let notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = notificationText;

    // Append the new notification to the list
    document.getElementById('notificationList').appendChild(notification);
};


// Client-side socket event listener
socket.on("user-action-notification", (data) => {
    const { action, userId } = data;
    console.log(`Notification received: User ${userId} performed action: ${action}`);
    updateUserStatus(userId, action);  
});

// Listen for events from the server
socket.on('playVideo', ({ userId }) => {
    const muteElement = document.querySelector(`#container-${userId} .video-mute`);
    if (muteElement) {
        muteElement.style.display = 'none';
    }
});

socket.on('pauseVideo', ({ userId }) => {
    const muteElement = document.querySelector(`#container-${userId} .video-mute`);
    if (muteElement) {
        muteElement.style.display = 'block';
    }
});
