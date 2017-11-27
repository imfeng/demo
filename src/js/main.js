const FIREBASE_STORAGE_URL = 'gs://firebee-95773.appspot.com/videos/video_';// FIREBASE_STORAGE_URL + id + '.mp4'


// General functions
(function() {
    /*document.body.addEventListener('ready', function(event) { 
        //console.log(event);
        
    });*/
    console.log('RUN!');
    fireInit();
    // Firebase Functions
    var storage, user;
    function fireInit(){
        firebase.initializeApp({
            apiKey: "AIzaSyDqbg8rtwpnG0vL5Z7nepReQ0NMC6Sth2w",
            authDomain: "firebee-95773.firebaseapp.com",
            databaseURL: "https://firebee-95773.firebaseio.com",
            projectId: "firebee-95773",
            storageBucket: "firebee-95773.appspot.com",
            messagingSenderId: "345015058827"
        });
        firebase.auth().signInAnonymously().then(function(u){
            user = u;
            console.log('Auth Sucessed!');
            console.log(user);
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log('Firebase 授權錯誤！');
            console.log(error);
            
            // ...
        });
        firebase.auth().onAuthStateChanged(function(u) {
            if (u) {
              // User is signed in.
              //user = u;
              console.log('WHATTTTTTTTTTTT');
              //console.log(user);
              // ...
            } else {
              // User is signed out.
              // ...
            }
        });
        storage = firebase.storage();
    }

    function goLoadFireVideo(idx){
        console.log('goLoadFireVideo('+idx+')');
        var videoRef = storage.refFromURL
        (FIREBASE_STORAGE_URL + idx + '.mp4');
        videoRef.getDownloadURL().then(function(url) {
            console.log("GOT " + idx + " @ " + url);
            player.source({
                type: "video",
                title: "Video "+idx,
                sources: [
                    {
                        src: url,
                        type: "video/mp4"
                    }
                ]
            });
        });
    }
    /** */

    // **plyr** functions
    var instances = plyr.setup({
        debug: false,
        title: "Video demo",
        iconUrl: "bower_components/plyr/dist/plyr.svg",
        tooltips: {
            controls: true
        },
        captions: {
            defaultActive: true
        }
    });
    plyr.loadSprite("bower_components/plyr/dist/demo.svg");

    // Plyr returns an array regardless
    var player = instances[0];

    // Setup type toggle
    var fireBtns = document.querySelectorAll("[fire-video]")
        types = {
            video: "video",
            audio: "audio",
            youtube: "youtube",
            vimeo: "vimeo"
        },
        currentType = window.location.hash.replace("#", ""),
        historySupport = window.history && window.history.pushState;


    /* DOM  */
    // Bind to each button
    for (var a = fireBtns.length-1; a >=0; a--){

        fireBtns[a].addEventListener("click",function(){
            var idx = this.getAttribute("fire-video");
            console.log('FireBtn Clicked : '+idx);

            btnToogle(idx);
            goLoadFireVideo(idx);
        })
    }

    // Toggle class on an element
    function toggleClass(element, className, state) {
        if (element) {
            if (element.classList) {
                element.classList[state ? "add" : "remove"](className);
            } else {
                var name = (" " + element.className + " ").replace(/\s+/g, " ").replace(" " + className + " ", "");
                element.className = name + (state ? " " + className : "");
            }
        }
    }
    
    function btnToogle(idx){
        // Remove active classes
        for (var x = fireBtns.length - 1; x >= 0; x--) {
            toggleClass(fireBtns[x].parentElement, "active", false);
        }

        // Set active on parent
        toggleClass(document.querySelector('[fire-video="' + idx + '"]').parentElement, "active", true);
    }
})();
