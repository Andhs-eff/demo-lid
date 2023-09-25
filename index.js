console.warn = () => {};

const myProgress = new ProgressBar.Circle('#progress', {
  color: "palegreen", 
  strokeWidth: 10.0,
  trailColor: 'transparent',
  text: {
    style: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        padding: 0,
        margin: 0,
        fontSize: '30px',
        fontWeight: 'bold',
        transform: {
            prefix: true,
            value: 'translate(-50%, -50%)'
        }
    }
  },
});

myProgress.animate(0.1);
myProgress.setText("10%");

import { LangCode } from "./lcodes/LangCode.js";
import {francAll} from 'https://esm.sh/franc@6?bundle';
import {langDetector} from './eld/languageDetector.js'; 

myProgress.animate(0.5);
myProgress.setText("50%");

import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

myProgress.animate(0.7);
myProgress.setText("70%");

let classifier = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');

myProgress.animate(0.9);
myProgress.setText("90%");

let classifier_mms = await pipeline('audio-classification', 'Xenova/mms-lid-126');

const myAvatar = localStorage.getItem('myAvatar');

const content = document.getElementById("content");
const talkVideo = document.getElementById('talk-video');
const nativeReply = document.getElementById("native-reply");
const englishReply = document.getElementById("english-reply");
const micImage = document.getElementById("start_img");

langDetector.returnScores = true

let blob;

let iter = 0;

let languageName = new Intl.DisplayNames(['en'], {type: 'language'});

let okButton;

let noButton;

let recLang;

let recText;

let fullLang;

let targetCode;

let displayText;

const video_codes = ["en", "ru", "es", "fr"];

let triedLang = [];

const tags = {
  1: "span style='color: red;'",
  2: "/span",
  3: "br/",
  4: "span style='color: blue;'"
};

myProgress.animate(1.0);
myProgress.setText("100%");

// hotfix for video height
if (myAvatar == "f") {
  talkVideo.height = 544;
}

function setVideoElement(stream) {
  talkVideo.src = stream;
  talkVideo.loop = false;

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  talkVideo.src = './speech/' + myAvatar + "_idle.mp4";
  talkVideo.loop = true;
}

myProgress.destroy();
document.getElementById("progress").remove();

playIdleVideo();

/* ************************************************************************
* Microphone input processing 
*/
let flag = false;
let rec;
document
  .getElementById('whisper')
  .addEventListener("click", toggler);

function toggler() {
if (flag) {
    stopFunction();
    }
else {
    initFunction();
}
}

function initFunction() {
   flag = !flag;
  // Display recording
  async function getUserMedia(constraints) {
    if (window.navigator.mediaDevices) {
      return window.navigator.mediaDevices.getUserMedia(constraints);
    }
    let legacyApi =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    if (legacyApi) {
      return new Promise(function (resolve, reject) {
        legacyApi.bind(window.navigator)(constraints, resolve, reject);
      });
    } else {
      alert("user api not supported");
    }
  }

  let audioChunks = [];
  function handlerFunction(stream) {
    micImage.src = "./assets/mic-animate.gif";
    micImage.classList.remove('anima');
    rec = new MediaRecorder(stream);
    rec.start();

    function restartTimer() {
        setTimeout(function() {
            rec.stop();
            document.getElementById("start_img").src = "./assets/mic.gif";
        }, 8 * 1000);
    }

    // We listen only for a certain amount of time, then we form a blob
    restartTimer();    


    rec.ondataavailable = (e) => {
      audioChunks.push(e.data);
      if (rec.state == "inactive") {
        blob = new Blob(audioChunks, { type: "audio/wav" });
        newPage();
        langDetectAudio(blob);
      }
    };
  }
  function startusingBrowserMicrophone(boolean) {
    getUserMedia({ audio: boolean }).then((stream) => {
      handlerFunction(stream);
    });
  }

  startusingBrowserMicrophone(true);

}

function stopFunction() {
	flag = !flag;
	rec.stop();
    document.getElementById("start_img").src = "./assets/mic.gif";
}

/* ************************************************************************
* Text input processing 
*/

document.getElementById("intext")
.addEventListener("input", function onEvent(event) {
  const printed = document.getElementById("intext").value;
  if (printed.slice(-1) == "\n") {
    if (printed == "\n") {
      document.getElementById("intext").value = "";
      document.getElementsByClassName("keyboardInputInitiator")[0].classList.add('anima');
    } else {
    newPage();
    langDetectText(printed);
    }
  } else {
    document.getElementsByClassName("keyboardInputInitiator")[0].classList.remove('anima');
  }
    });

/* ************************************************************************
* Language identification 
*/

async function langDetectAudio(blob){

  switch (iter) {
      case 2:
          [recLang, recText]  = await sendTranscribe1(blob);
          fullLang = languageName.of(recLang);
          // No language options so mark incorrect language as not recognized
          if (triedLang.includes(fullLang)) {
            fullLang = null;
          }
          break;
      case 0:
          [recLang, recText]  = await sendTranscribe2(blob);
          fullLang = languageName.of(recLang);
          triedLang.push(fullLang);
          break;
      case 1:
          recLang  = await sendTranscribe3(blob);
          fullLang = languageName.of(recLang);
          triedLang.push(fullLang);
          recText = ""; 
          break;           
  }    
                
    replyProcessing(fullLang, recText);
}

async function langDetectText(sourceText) {

  switch (iter) {
      case 0:
          [recLang, recText]  = await googleTranslate("auto", "en", sourceText);
          fullLang = languageName.of(recLang);
          triedLang.push(fullLang);
          break;
      case 1:
          let selected_franc = francAll(sourceText, {minLength: 6}).slice(0,2);
          recLang  = selected_franc.filter(element => !triedLang.includes(languageName.of(element[0])))[0][0];
          fullLang = languageName.of(recLang);
          triedLang.push(fullLang);
          break;
      case 2:
          let selected_eld = Object.entries(langDetector.detect(sourceText)['scores']);
          recLang  = selected_eld.filter(element => !triedLang.includes(languageName.of(element[0])))[0][0];
          fullLang = languageName.of(recLang);
          break;           
  }    
                
    replyProcessing(fullLang, sourceText);
    }

async function replyProcessing(recognizedLang, userText) {

  if (iter == 0) {
   
    document.getElementById("inter").style.display = "none";
    // document.getElementById("test-button").style.display = "none";

    const ok = document.createElement('button');
    ok.id = "ok-button";
    ok.style.marginTop = "20px";
    ok.style.marginRight = "200px";
    const okImage = document.createElement('img');
    okImage.width = 80;
    okImage.height = 60;
    okImage.src = "./assets/thumb-up.svg";

    ok.appendChild(okImage);

    const no = document.createElement('button');
    no.id = "no-button";
    no.style.marginTop = "20px";
    const noImage = document.createElement('img');
    noImage.width = 80;
    noImage.height = 60;
    noImage.src = "./assets/confusion.png";

    no.appendChild(noImage);

    content.appendChild(ok);
    content.appendChild(no);

    okButton = document.getElementById('ok-button');
    noButton = document.getElementById('no-button');

  }

  targetCode = await LangCode.encode(recognizedLang);
  if (targetCode == null) {
    nativeReply.innerHTML = "<br/><br/>Sorry, I can't recognize the language.";
    englishReply.innerHTML = "<br/><br/>Sorry, I can't recognize the language.";
    
    goRetry();

  } else {
    if (userText != "") {
      displayText = `You seem to be speaking <3><1>${recognizedLang} <2><3>Is it correct?<3><3>Your text:`;
      var [, userTextEnglish] = await googleTranslate(targetCode, "en", userText);
    } else {
      displayText = `You seem to be speaking <3><1>${recognizedLang} <2><3>Is it correct?`;
      var userTextEnglish = "";
    }
    const [, nativeText] = await googleTranslate("en", targetCode, displayText);
    nativeReply.innerHTML = `${nativeText} <span style='color: springgreen;'>${userText}</span>`.replace(/[123]/g, m => tags[m]);
    englishReply.innerHTML = `${displayText} <span style='color: seagreen;'>${userTextEnglish}</span>`.replace(/[123]/g, m => tags[m]);
    if (video_codes.includes(targetCode)) {
      const stream = "./speech/" + targetCode + "_g_" + myAvatar + ".mp4";
      setVideoElement(stream);
      talkVideo.onended = playIdleVideo;
    }

  }

  noButton.onclick = () => {

    ++iter;

    progressDisplay();

    if (iter > 2) {
      nativeReply.innerHTML = "<br/><br/>Sorry, I can't recognize the language.";
      englishReply.innerHTML = "<br/><br/>Sorry, I can't recognize the language.";
      goRetry();

    } else if (blob != undefined) {     
      langDetectAudio(blob);
    } else {
      langDetectText(userText);
    }

  };

  okButton.onclick = async () => {
    const successText = "<4>Great! <2><3>I'm connecting you to the interpreter speaking your language.<3>Please wait.";
    const [, finalText] = await googleTranslate("en", targetCode, successText);
    nativeReply.innerHTML = finalText.replace(/[423]/g, m => tags[m]);
    englishReply.innerHTML = successText.replace(/[423]/g, m => tags[m]);
    if (video_codes.includes(targetCode)) {
      const stream = "./speech/" + targetCode + "_s_" + myAvatar + ".mp4";
      setVideoElement(stream);
      talkVideo.onended = playIdleVideo;
    }
  
    goRetry();
  
  };

}

async function sendTranscribe1(blob) {
  try {

    const headers = {
        authorization: 'ba693edc5038455084d21c63b09d632d',
    };

    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: headers,
        body: blob,
        });

    const uploadUrl = await uploadResponse.json();
    
    const audio_data = {
        audio_url: uploadUrl.upload_url,
        language_detection: true
    };

    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(audio_data),
        });

    const transcriptId = await response.json();

    const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId.id}`;

    while (true) {
      const pollingResponse = await fetch(pollingEndpoint, {
        method: "GET",
        headers: headers
      });
      const transcriptionResult = await pollingResponse.json();
    
      if (transcriptionResult.status === 'completed') {
        return [transcriptionResult.language_code, transcriptionResult.text];
        // break
      } else if (transcriptionResult.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

  } catch (error) {
    console.error(error);
  }
}

async function sendTranscribe2(blob) {
    try {
    
        let url = URL.createObjectURL(blob);
        let result = await classifier(url);

        const [codeGoogle] = await googleTranslate("auto", "en", result.text);

        return [codeGoogle, result.text];

    } catch (error) {
        console.error(error);
    }
}

async function sendTranscribe3(blob) {
    try {
    
        let url = URL.createObjectURL(blob);
        let result = await classifier_mms(url);
        // Excluding previous incorrect languages
        let label = result.filter(element => !triedLang.includes(languageName.of(element.label)))[0].label;
        return label;

    } catch (error) {
        console.error(error);
    }
}

async function googleTranslate(sourceLang, targetLang, sourceText) {
  try {
    
    let google_url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);
    
    const googleResponse = await fetch(google_url, {
        method: "GET",
      });
    const translateResult = await googleResponse.json();
    const resArr = [];
    for (let i = 0; i < translateResult[0].length; i++) {
      resArr.push(translateResult[0][i][0]);
    }
    return [translateResult[2], resArr.join("")];
  } catch (error) {
    return ["en", "Sorry, translation failed"]
  }
}

/* ***********************************************************
* New page elements
*/

function progressDisplay() {
  nativeReply.innerHTML = "";
  const progressImage1 = document.createElement('img');
  progressImage1.width = 80;
  progressImage1.height = 60;
  progressImage1.src = "./assets/progress.gif";
  nativeReply.appendChild(progressImage1);
  englishReply.innerHTML = "";
  const progressImage2 = document.createElement('img');
  progressImage2.width = 80;
  progressImage2.height = 60;
  progressImage2.src = "./assets/progress.gif";
  englishReply.appendChild(progressImage2);
}

function newPage() {
  document.getElementById("intext").style.display = "none";
  document.getElementById("whisper").style.display = "none";
  VKI_close();
  document.getElementsByClassName("keyboardInputInitiator")[0].style.display = "none";

  progressDisplay();
}

function goRetry() {
  document.getElementById("ok-button").remove();
  document.getElementById("no-button").remove();

  const retry = document.createElement('button');
  retry.id = "retry-button";
  retry.style.marginTop = "20px";
  const retryImage = document.createElement('img');
  retryImage.width = 80;
  retryImage.height = 60;
  retryImage.src = "./assets/retry.svg";

  retry.appendChild(retryImage);

  content.appendChild(retry);

  const retryButton = document.getElementById('retry-button');

  retryButton.onclick = () => {
    // window.location.reload();
    iter = 0;
    document.getElementById('retry-button').remove();
    document.getElementById("inter").style.display = "flex";
    document.getElementById("whisper").style.display = "block";
    document.getElementById("intext").style.display = "block";
    document.getElementById("intext").value = "";
    document.getElementsByClassName("keyboardInputInitiator")[0].style.display = "block";
    nativeReply.innerHTML = "";
    englishReply.innerHTML = "";
  }
}