(function() {
const webcam = document.querySelector('#webcam');
let model, faceCanvas, w, h;
async function renderPredictions(t) {
  requestAnimationFrame(renderPredictions);
  const predictions = await model.estimateFaces(webcam);

  if (predictions.length > 0) {
    // var positionBufferData = TRIANGULATION.reduce((acc, val) => acc.concat(predictions[0].scaledMesh[val]), []);
    const positionBufferData = predictions[0].scaledMesh.reduce((acc, pos) => acc.concat(pos), []);
    if(!faceCanvas) {
      const props = {
        id: 'faceCanvas',
        // https://dribbble.com/shots/4875818-Theyyam
        textureFilePath: 'assets/mesh_map_theyyam.jpg', 
        w, h
      }
      faceCanvas = new FaceMask(props);
      return;
    } 
    faceCanvas.render(positionBufferData);
  }
}
async function main() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    webcam.srcObject = stream;
    await new Promise(function(res) {
      webcam.onloadedmetadata = function() {
        w = webcam.videoWidth;
        h = webcam.videoHeight;
        res();
      }
    });
    
    webcam.height = h;
    webcam.width = w;
    webcam.setAttribute('autoplay', true);
    webcam.setAttribute('muted', true);
    webcam.setAttribute('playsinline', true);
    webcam.play();
    
    // Load the MediaPipe facemesh model.
    model = await facemesh.load({
      maxContinuousChecks: 5,
      detectionConfidence: 0.9,
      maxFaces: 1,
      iouThreshold: 0.3,
      scoreThreshold: 0.75
    });
    renderPredictions();
  } catch(e) {
    console.error(e);
  }
}
main();
})();