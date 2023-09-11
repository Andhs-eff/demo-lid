var flag = false;
var rec;
document
  .getElementById("startRecording")
  .addEventListener("click", toggler);
let isRecording = document.getElementById("isRecording");
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
  document.getElementById("startRecording").textContent = "Stop"
  isRecording.textContent = "Recording...";
  //
  let audioChunks = [];
  //let rec;
  function handlerFunction(stream) {
    rec = new MediaRecorder(stream);
    rec.start();
    rec.ondataavailable = (e) => {
      audioChunks.push(e.data);
      if (rec.state == "inactive") {
        let blob = new Blob(audioChunks, { type: "audio/wav" });
        console.log(blob);
        document.getElementById("audioElement").src = URL.createObjectURL(blob);

        async function sendTranscribe(blob) {
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
            console.log(uploadUrl);
            
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
            console.log(transcriptId);

            const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId.id}`;
   
            while (true) {
              const pollingResponse = await fetch(pollingEndpoint, {
                method: "GET",
                headers: headers
              });
              const transcriptionResult = await pollingResponse.json();
              console.log(transcriptionResult);
            
              if (transcriptionResult.status === 'completed') {
                console.log(transcriptionResult.text);
                document.getElementById("asr").textContent = transcriptionResult.text;
                break
              } else if (transcriptionResult.status === 'error') {
                throw new Error(`Transcription failed: ${transcriptionResult.error}`);
              } else {
                await new Promise((resolve) => setTimeout(resolve, 3000));
              }
            }
/*              // Список транскриптов
              const listResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
                method: "GET",
                headers: headers
              });
              const listResult = await listResponse.json();
              console.log(listResult);  */

              const deleteResponse = await fetch(pollingEndpoint, { method: 'DELETE', headers: headers })
              console.log(await deleteResponse.json())

          } catch (error) {
            console.error(error);
          }
      }
            
      sendTranscribe(blob);
     
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
  document.getElementById("startRecording").textContent = "Start"
  isRecording.textContent = "Click play button to start listening";
}

function toggler() {
	if (flag) {
		stopFunction();
		}
	else {
		initFunction();
	}
}