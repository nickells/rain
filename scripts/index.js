import SimpleReverb from './simple-reverb'

// Globals
let audioCtx, gainNode, biquadFilter, panNode, reverb


const numWithUncertainty = (num, percent = 0.25, start = 0) => {
  const offset = num * percent
  return num + (offset / 2 ) - (Math.random() * offset) + start
}

const playOsc = () => {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'triangle';
  const freq = numWithUncertainty(1500, 1)
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz

  biquadFilter = audioCtx.createBiquadFilter();
  const filter = numWithUncertainty(1300, .25);
  biquadFilter.frequency.value = filter;
  
  panNode = audioCtx.createStereoPanner();
  const pan = 1 - (Math.random() * 2)
  panNode.pan.setValueAtTime(pan, audioCtx.currentTime)
  
  oscillator.connect(panNode)
  panNode.connect(biquadFilter)
  biquadFilter.connect(gainNode)
  
  let duration = numWithUncertainty(3)
  oscillator.start();
  setTimeout(() => {
    oscillator.stop()
  }, duration)

  createVisual(freq / 1600, pan, filter / 1250, duration)
}

const createVisual = (freq, position, filter, duration) => {
  const elem = document.createElement('div')
  elem.classList.add('drop')
  // elem.style.position = 'absolute'
  const size = (10 * freq) + 5
  elem.style.width = size * 2.5
  elem.style.height = size
  // elem.style.backgroundColor = 'black'
  elem.style.top = '50px'
  elem.style.left = `${Math.floor(window.innerWidth / 2) + ((window.innerWidth / 2) * position)}px`
  elem.style.opacity = filter

  document.body.appendChild(elem)
  setTimeout(() => {
    document.body.removeChild(elem)
  }, 200)
}

const makeNoiseBuffer = () => {

}

document.getElementById('init').addEventListener('click', () => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime)
  reverb = new SimpleReverb(audioCtx, {
    seconds: 1,
    decay: 1,
    reverse: 0,
  })
  gainNode.connect(reverb.input);
  gainNode.connect(audioCtx.destination)
  reverb.connect(audioCtx.destination);
})

document.getElementById('init').click()

document.getElementById('drop').addEventListener('click', () => {
  function rain(){
    playOsc()
    setTimeout(rain, numWithUncertainty(100, 0.8))
  }
  rain()
})