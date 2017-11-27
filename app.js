const FIREBASE_STORAGE_URL = 'gs://firebee-95773.appspot.com/videos/video_';// FIREBASE_STORAGE_URL + id + '.mp4'
const VIDEO_ID_START = 1;
const VIDEO_ID_END = 3;
const VIDEO_ID_TOTAL = VIDEO_ID_END - VIDEO_ID_START+1;

//For global access
var primaryID = 0,
storage, db;

//Video Methods
var offsets = Array(new Array(VIDEO_ID_TOTAL)).map(v=>0);

//Login Dialog
/*
BootstrapDialog.show({
    title: 'Login',
    message: 'Email: <input type="email" id="email" class="form-control"><br>Password: <input type="Password" id="password" class="form-control">',
    onhide: function(dialogRef) {
        console.log('Login!');
        email = dialogRef.getModalBody().find('#email').val();
        password = dialogRef.getModalBody().find('#password').val();
        if (email.length > 5 && password.length >= 6) {
            init(email, password);
            return true;
        }
        return false;
    },
    buttons: [{
        label: 'Go',
        action: function(dialogRef) {
            dialogRef.close();
        }
    }]
});*/


function doToAll(func) {
    for (var i = VIDEO_ID_START; i <= VIDEO_ID_END; i++) {
        var video = document.getElementById('vid' + i);
        func(video, i);
    }
}

function getCurrentTime() {
    return document.getElementById('vid' + primaryID).currentTime - offsets[primaryID];
}

function getCurrentSpeed() {
    return document.getElementById('vid' + primaryID).playbackRate;
}

function rotatePrimary() {
    var oldVid = document.getElementById('vid' + primaryID);
    primaryID = (primaryID + 1) % VIDEO_ID_TOTAL +1;
    var newVid = document.getElementById('vid' + primaryID);

    oldVid.muted = true;
    newVid.muted = false;
    document.getElementById('primary').innerHTML = primaryID;
}

function modifyOffset(value, id) {
    var vidID = id || primaryID;
    db.ref('offsets/' + vidID).set(value);
}

function resetOffsets() {
    BootstrapDialog.show({
        title: 'Reset',
        message: 'Are you sure???',
        onhide: function(dialogRef) {
            return true;
        },
        buttons: [{
            label: 'Yes',
            action: function(dialogRef) {
                for (var i = VIDEO_ID_START; i <= VIDEO_ID_END; i++) {
                    modifyOffset(0, i);
                }
                dialogRef.close();
            }
        }, {
            label: 'No',
            action: function(dialogRef) {
                dialogRef.close();

            }
        }]
    });
}

//Init Firebase
function init(email, pass) {

    firebase.initializeApp(config);
    firebase.auth().signInAnonymously().catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(error);
        alert('Firebase 授權錯誤！');
        // ...
      });
    //firebase.auth().signInWithEmailAndPassword(email, pass)

    db = firebase.database();

    doToAll(function(v, id) {
        var offsetRef = db.ref('offsets/' + id);
        offsetRef.on('value', function(content) {
            offsets[id] = content.val();
            v.currentTime = offsets[id];
            console.log('OFFSET ' + id + ' = ' + offsets[id]);
        });
    })

    var ignore = true; //Ignore the first result to avoid auto pausing
    var cmdRef = db.ref('command');
    cmdRef.on('value', function(v) {

        if (!ignore) {

            var content = v.val();

            if (content.action === 'play') {
                doToAll(function(v) {
                    v.play();
                });
            } else if (content.action === 'pause') {
                doToAll(function(v) {
                    v.pause();
                });
            } else if (content.action === 'reset') {
                doToAll(function(v, id) {
                    v.pause();
                    v.currentTime = offsets[id];
                    v.playbackRate = 1;
                });
            } else if (content.action === 'set') {
                doToAll(function(v, id) {
                    v.currentTime = content.time + offsets[id];
                });
            } else if (content.action === 'speed') {
                doToAll(function(v) {
                    v.playbackRate = content.rate;
                });
            }

        } else {
            ignore = false;
        }

    });

    //Load Videos
    storage = firebase.storage();
    loadVideos();

}



function upload() {
    BootstrapDialog.show({
        title: 'Upload',
        message: 'ID ('+VIDEO_ID_START+'-'+VIDEO_ID_END+'): <input type="number" id="num" max='+VIDEO_ID_END+' min='+VIDEO_ID_START+' class="form-control"><br>File: <input type="file" id="file" class="form-control">',
        onhide: function(dialogRef) {

            var id = dialogRef.getModalBody().find('#num').val();
            var vidFile = dialogRef.getModalBody().find('#file').get(0).files[0];

            if (dialogRef.getModalBody().find('#file').val().length > 5) {

                document.getElementById('uploadbtn').innerHTML = 'Uploading...';
                document.getElementById('uploadbtn').onClick = '';
                document.getElementById('uploadbtn').className = 'btn btn-success';

                var videoRef = storage.refFromURL(FIREBASE_STORAGE_URL + id + '.mp4');
                var uploadTask = videoRef.put(vidFile)

                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) { // Loading...

                    var percent = snapshot.bytesTransferred / snapshot.totalBytes * 100;
                    document.getElementById('uploadbtn').innerHTML = 'Uploading...' + percent.toFixed(2) + '%';

                }, function(error) { // Error!

                    console.log(error);

                }, function() { // Done.

                    document.getElementById('uploadbtn').innerHTML = 'Upload';
                    document.getElementById('uploadbtn').onClick = 'upload()';
                    document.getElementById('uploadbtn').className = 'btn btn-info';
                    loadVideos();

                });

            }
            return true;
        },
        buttons: [{
            label: 'Upload',
            action: function(dialogRef) {
                dialogRef.close();
            }
        }]
    });
}

//Helper Funcs
function loadVideos() {
    doToAll(function(v, id) {
        var videoRef = storage.refFromURL
        (FIREBASE_STORAGE_URL + id + '.mp4');
        videoRef.getDownloadURL().then(function(url) {
            console.log("GOT " + id + " @ " + url);
            v.src = url;
            v.currentTime = offsets[id];
            v.controls = false;
            if (id != primaryID) {
                v.muted = true;
            }
        });
    });
}

function send(content) {
    db.ref('command').set(content);
}
