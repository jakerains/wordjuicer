importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');

self.onmessage = async function(e) {
  if (e.data.type === 'encode') {
    try {
      const buffer = e.data.buffer;
      const wav = new Int16Array(buffer);
      
      // Configure MP3 encoder
      const mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128);
      const sampleBlockSize = 1152; // Multiple of 576
      const mp3Data = [];
      
      // Encode to MP3
      for (let i = 0; i < wav.length; i += sampleBlockSize) {
        const sampleChunk = wav.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
      
      // Get the last buffer of MP3 data
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      
      // Send the encoded MP3 data back to the main thread
      self.postMessage({
        type: 'complete',
        buffer: mp3Data
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
}; 