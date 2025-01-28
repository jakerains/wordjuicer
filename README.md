# WordJuicer 🎯

WordJuicer is a powerful application that leverages state-of-the-art language models for text processing and analysis. This project integrates with multiple AI service providers to offer flexible and robust text processing capabilities.

## 🚀 Features

- Multi-provider support for AI services:
  - OpenAI
  - Hugging Face
  - Groq
- Utilizes the advanced Whisper Large V3 Turbo model
- Seamless API integration
- Cross-platform compatibility

## 🛠️ Technology Stack

- Model: `whisper-large-v3-turbo`
- Supported Providers:
  - Hugging Face (Endpoint: `https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo`)
  - Groq (Endpoint: `https://api.groq.com/openai/v1/chat/completions`)
  - OpenAI (Endpoint: `https://api.openai.com/v1/chat/completions`)

## 🔧 Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jakerains/wordjuicer.git
   cd wordjuicer
   ```

2. Set up your environment variables by copying the example file:
   ```bash
   cp .env.example .env
   ```

3. Configure your API keys in the `.env` file for the services you plan to use.

## 🌐 Quick Start

You can instantly start developing with WordJuicer using StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/jakerains/wordjuicer)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📫 Contact

- GitHub: [@jakerains](https://github.com/jakerains)

## ⭐ Show your support

Give a ⭐️ if this project helped you!