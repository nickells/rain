import SimpleReverb from './simple-reverb'
import * as dat from 'dat.gui';
 
// Globals
let audioCtx, gainNode, reverb

class Drops {
  constructor(){
    this.baseFreq = 75
    this.freqVariance = 0.5
    this.baseFilter = 340
    this.filterVariance = .25
    this.filterResonance = 4
    this.filterType = 'bandpass'
    this.duration = 3
    this.interval = 232
    this.intervalVariance = 0.79
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

    // reverb.connect(audioCtx.destination);
  }

  drip(){
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    const freq = numWithUncertainty(this.baseFreq, this.freqVariance)
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
  
    const biquadFilter = audioCtx.createBiquadFilter();
    const filter = numWithUncertainty(this.baseFilter, this.filterVariance);
    biquadFilter.frequency.value = filter;
    biquadFilter.type = this.filterType
    biquadFilter.Q.value = this.filterResonance
    
    const panNode = audioCtx.createStereoPanner();
    const pan = 1 - (Math.random() * 2)
    panNode.pan.setValueAtTime(pan, audioCtx.currentTime)
    
    const gainNode = audioCtx.createGain();
    oscillator.start();
    gainNode.gain.setValueAtTime(this.gain, audioCtx.currentTime)
    // gainNode.gain.setTargetAtTime(this.gain, audioCtx.currentTime, 0.008)
    
    oscillator.connect(panNode)
    panNode.connect(biquadFilter)
    biquadFilter.connect(gainNode)
    gainNode.connect(reverb.input);
    gainNode.connect(audioCtx.destination)
    
    let duration = numWithUncertainty(this.duration)
    
    setTimeout(() => {
      // gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.008)
      // gainNode.gain.setValueAtTime(0, audioCtx.currentTime, 1)
      oscillator.stop()

      // todo: garbage collect?
      oscillator.disconnect(panNode)
    }, duration)
  
    this.createVisual(
      freq / (this.baseFreq + (this.baseFreq * this.freqVariance)),
      pan,
      filter / (this.baseFilter + (this.baseFilter * this.filterVariance)),
      duration
    )

    reverb.seconds = this.reverbSeconds
    reverb.decay = this.reverbDecay
  }

  createVisual(freq, position, filter, duration){
    const elem = document.createElement('div')
    elem.classList.add('drop')
    const size = (10 * freq) + 5
    elem.style.width = size * 2.5
    elem.style.height = size
    
    elem.style.left = `${Math.floor(window.innerWidth / 2) + ((window.innerWidth / 2) * position)}px`
    elem.style.opacity = 1 - (filter / 2)
  
    document.body.appendChild(elem)
    setTimeout(() => {
      document.body.removeChild(elem)
    }, 200)
  }

  start(){
    const rain = () => {
      this.drip()
      setTimeout(rain, numWithUncertainty(this.interval, this.intervalVariance))
    }
    rain()
  }
}

const numWithUncertainty = (num, percent = 0.25, start = 0) => {
  const offset = num * percent
  return num + (offset / 2 ) - (Math.random() * offset) + start
}


const makeNoiseBuffer = () => {

}

const Rain = new Drops


document.getElementById('drop').addEventListener('click', () => {
  Rain.start()
})

document.getElementById('one').addEventListener('click', () => {
  Rain.drip()
})

window.onload = function() {
  var gui = new dat.GUI();
  gui.remember(Rain);
  const freq = gui.addFolder('droplet')
  const filter = gui.addFolder('filter')
  // const droplet = gui.addFolder('droplet')
  freq.add(Rain, 'baseFreq', 0, 2000)
  freq.add(Rain, 'freqVariance', 0, 2)
  freq.add(Rain, 'duration', 0.1, 5)
  freq.add(Rain, 'gain', 0, 1)
  filter.add(Rain, 'baseFilter', 0, 2000)
  filter.add(Rain, 'filterVariance', 0, 2)
  filter.add(Rain, 'filterResonance', 0, 100)
  filter.add(Rain, 'filterType', ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'])
  gui.add(Rain, 'interval', 0, 500)
  gui.add(Rain, 'intervalVariance', 0, 1)
  
  const reverb = gui.addFolder('reverb')
  reverb.add(Rain, 'reverbSeconds', 0.001, 1)
  reverb.add(Rain, 'reverbDecay', 0.001, 1)
  freq.open()
  filter.open()
  reverb.open();
}