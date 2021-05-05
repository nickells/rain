import SimpleReverb from './simple-reverb'
import * as dat from 'dat.gui';
 
// Globals
let audioCtx, reverb, compressor

const FALL_SPEED = 200;

const area = document.getElementById('area')
document.body.style.setProperty('--fall-speed', FALL_SPEED)
/*
  TO DO
  LPF THE WHOLE THING
  FIGURE OUT HOW MANY OSC WE USE
  REMOVE THE OSC SETTINGS
  REAL BINAURAL DELAY
  ADD A REAL CONVOLUTIONAL REVERB
  THUNDER SOUNDS?
*/

const pan = () => (Math.random() * 2) - 1

const soundBank = []

const panner = (posX, posY, posZ = 0) => {
  const pannerModel = 'HRTF';
  const innerCone = 60;
  const outerCone = 90;
  const outerGain = 0.3;
  const distanceModel = 'linear';
  const maxDistance = 10000;
  const refDistance = 1;
  const rollOff = 30;
  const positionX = posX;
  const positionY = posY;
  const positionZ = posZ;
  
  const orientationX = 0.0;
  const orientationY = 0.0;
  const orientationZ = -1.0;

  const panner = new PannerNode(audioCtx, {
    panningModel: pannerModel,
    distanceModel: distanceModel,
    positionX: positionX,
    positionY: positionY,
    positionZ: positionZ,
    orientationX: orientationX,
    orientationY: orientationY,
    orientationZ: orientationZ,
    refDistance: refDistance,
    maxDistance: maxDistance,
    rolloffFactor: rollOff,
    coneInnerAngle: innerCone,
    coneOuterAngle: outerCone,
    coneOuterGain: outerGain
  })
  return panner
}

class Drops {
  constructor(){
    this.baseFreq = 75
    this.freqVariance = 0.5

    this.decayTime = 0.071
    this.baseFilter = 340
    this.filterVariance = 1.1
    this.filterResonance = 2.8
    this.filterType = 'bandpass'
    this.duration = 14
    this.interval = 97
    this.intervalVariance = 1
    this.gain = 0.1
    this.reverbSeconds = 0.17
    this.reverbDecay = 1
    this.init()
  }
  
  init(){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    reverb = new SimpleReverb(audioCtx, {
      seconds: this.reverbSeconds,
      decay: this.reverbDecay,
      reverse: 0,
    })

    compressor = compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

    reverb.connect(compressor)

    compressor.connect(audioCtx.destination);
  }

  getNoiseBuffer(){
    const noiseLength = 0.2 // seconds
    const bufferSize = audioCtx.sampleRate * noiseLength;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    let data = buffer.getChannelData(0); // get data

    // fill the buffer with noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    let noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    return noise
  }

  makeOsc(){
    const oscillator = audioCtx.createOscillator();
    const freq = numWithUncertainty(this.baseFreq, this.freqVariance)
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
    return oscillator
  }


  drip(positionX = pan(), positionZ = pan()){
    const sound = this.getNoiseBuffer()
    
    const panNode = panner(positionX, 0, positionZ)
    
    const biquadFilter = audioCtx.createBiquadFilter();
    const filter = numWithUncertainty(this.baseFilter, this.filterVariance);
    biquadFilter.frequency.value = filter;
    biquadFilter.type = this.filterType
    biquadFilter.Q.value = this.filterResonance
    
    // const panNode = audioCtx.createStereoPanner();
    sound.connect(panNode)
    
    const gainNode = audioCtx.createGain();
    soundBank.push(sound)
    gainNode.gain.setValueAtTime(this.gain, audioCtx.currentTime)
    panNode.connect(biquadFilter)
    biquadFilter.connect(gainNode)
    gainNode.connect(compressor)
    
    let duration = numWithUncertainty(this.duration)
    
    // start noise when the drop lands
    setTimeout(() => sound.start(), FALL_SPEED)
    
    // turn off noise after time
    setTimeout(() => {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, this.decayTime)
      soundBank.shift(sound)
    }, FALL_SPEED + duration)
  

    this.createVisual(
      1,
      // freq / (this.baseFreq + (this.baseFreq * this.freqVariance)),
      positionX,
      positionZ,
      filter / (this.baseFilter + (this.baseFilter * this.filterVariance)),
      duration
    )

    reverb.seconds = this.reverbSeconds
    reverb.decay = this.reverbDecay
  }

  createVisual(freq, positionX, positionZ, filter, duration){
    const elem = document.createElement('div')
    elem.classList.add('drop')
    const size = (100 * freq)
    elem.style.width = size
    elem.style.height = size
    
    elem.style.left = `${Math.floor(window.innerWidth / 2) + ((window.innerWidth / 2) * positionX)}px`
    elem.style.top = `${Math.floor(window.innerHeight / 2) + ((window.innerHeight / 2) * positionZ)}px`
    elem.style.opacity = 1 - (filter / 2)
  
    area.appendChild(elem)
    setTimeout(() => {
      area.removeChild(elem)
    }, FALL_SPEED + 500) // duration of the ripple animation
  }

  start(){
    const rain = () => {
      this.drip()
      this.timer = setTimeout(rain, numWithUncertainty(this.interval, this.intervalVariance))
    }
    rain()
  }

  stop(){
    clearInterval(this.timer);
  }
}

const numWithUncertainty = (num, percent = 0.25, start = 0) => {
  const offset = num * percent
  return num + (offset / 2 ) - (Math.random() * offset) + start
}


const Rain = new Drops

let on = false

document.getElementById('drop').addEventListener('click', (event) => {
  on = !on
  
  if (on){
    Rain.start()
    event.target.innerHTML = 'Stop Rain'
  } else{
    Rain.stop()
    event.target.innerHTML = 'Start Rain'
  } 
})

document.getElementById('one').addEventListener('click', () => {
  Rain.drip()
})

area.addEventListener('click', (evt) => {
  console.log(evt)
  const X = (((evt.pageX - 50) / window.innerWidth) *  2) - 1; 
  const Y = (((evt.offsetY - 60) / area.offsetHeight) * 2) - 1;
  Rain.drip(X, Y);
})

window.onload = function() {
  var gui = new dat.GUI();
  gui.remember(Rain);
  gui.useLocalStorage = true;
  const freq = gui.addFolder('droplet')
  const filter = gui.addFolder('filter')
  // const droplet = gui.addFolder('droplet')
  // freq.add(Rain, 'baseFreq', 0, 2000)
  // freq.add(Rain, 'freqVariance', 0, 2)
  freq.add(Rain, 'decayTime', 0.015, 0.1)
  freq.add(Rain, 'duration', 0.1, 100)
  freq.add(Rain, 'gain', 0, 10)
  filter.add(Rain, 'baseFilter', 0, 2000)
  filter.add(Rain, 'filterVariance', 0, 2)
  filter.add(Rain, 'filterResonance', 0, 10)
  filter.add(Rain, 'filterType', ['lowpass', 'highpass', 'bandpass',])
  gui.add(Rain, 'interval', 0, 500)
  gui.add(Rain, 'intervalVariance', 0, 1)
  
  // // const reverb = gui.addFolder('reverb')
  // // reverb.add(Rain, 'reverbSeconds', 0.001, 1)
  // // reverb.add(Rain, 'reverbDecay', 0.001, 1)
  freq.open()
  filter.open()
  // reverb.open();
}