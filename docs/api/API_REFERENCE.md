# Word Juicer API Reference

## Service Integration

### OpenAI Whisper

**Endpoint:** `https://api.openai.com/v1/audio/transcriptions`

**Model:** `whisper-1`

**Headers:**
```http
Authorization: Bearer YOUR_API_KEY
Accept: application/json
```

**Parameters:**
```json
{
  "file": "audio_file",
  "model": "whisper-1",
  "response_format": "verbose_json"
}
```

**Response Format:**
```json
{
  "text": "Transcribed text",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Segment text"
    }
  ]
}
```

### Groq

**Endpoint:** `https://api.groq.com/openai/v1/audio/transcriptions`

**Model:** `whisper-large-v3-turbo`

**Headers:**
```http
Authorization: Bearer YOUR_API_KEY
Accept: application/json
```

**Parameters:**
```json
{
  "file": "audio_file",
  "model": "whisper-large-v3-turbo",
  "response_format": "verbose_json",
  "language": "en",
  "temperature": 0
}
```

**Response Format:**
```json
{
  "text": "Transcribed text",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Segment text"
    }
  ]
}
```

### Hugging Face

**Endpoint:** `https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo`

**Headers:**
```http
Authorization: Bearer YOUR_API_KEY
Accept: application/json
```

**Parameters:**
```json
{
  "file": "audio_file",
  "wait_for_model": true,
  "return_timestamps": true,
  "chunk_length_s": 30,
  "stride_length_s": 5,
  "language": "en",
  "task": "transcribe",
  "return_segments": true,
  "batch_size": 1,
  "num_beams": 1,
  "temperature": 0,
  "compression_ratio_threshold": 2.4,
  "logprob_threshold": -1,
  "no_speech_threshold": 0.6,
  "condition_on_previous_text": false
}
```

**Response Format:**
```json
{
  "text": "Transcribed text",
  "chunks": [
    {
      "timestamp": [0.0, 2.5],
      "text": "Chunk text"
    }
  ]
}
```

## Error Handling

### Common Error Codes

#### Authentication Errors
- `401`: Invalid API key
- `403`: API key expired or insufficient permissions

#### Rate Limiting
- `429`: Too many requests
- `503`: Service temporarily unavailable

#### Processing Errors
- `400`: Invalid request format
- `413`: File too large
- `415`: Unsupported media type
- `422`: Unprocessable entity

### Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code",
    "param": "parameter_name"
  }
}
```

## Best Practices

### Rate Limiting
- OpenAI: 3000 RPM
- Groq: 100 RPM
- Hugging Face: Varies by tier

### File Requirements
- Maximum size: 100MB
- Supported formats: MP3, WAV, M4A, FLAC
- Recommended chunk size: 5MB

### Performance Optimization
- Use appropriate chunk sizes
- Implement retry mechanisms
- Handle rate limiting gracefully
- Cache results when possible

## Integration Examples

### cURL

```bash
# OpenAI
curl -X POST https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file=@audio.mp3 \
  -F model=whisper-1

# Groq
curl -X POST https://api.groq.com/openai/v1/audio/transcriptions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file=@audio.mp3 \
  -F model=whisper-large-v3-turbo

# Hugging Face
curl -X POST https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file=@audio.mp3
```

### JavaScript

```javascript
// OpenAI
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  body: formData
});

// Groq
const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  body: formData
});

// Hugging Face
const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  body: formData
});
```

## Security Considerations

### API Key Management
- Store keys securely
- Rotate keys regularly
- Use environment variables
- Implement key validation

### Data Protection
- Use HTTPS for all requests
- Validate file contents
- Implement request signing
- Monitor API usage

### Error Handling
- Implement retry logic
- Handle timeouts
- Log errors securely
- Monitor failure rates 