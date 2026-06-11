// ============================================================
// weather.js
// Busca o clima atual usando a API Open-Meteo (sem chave)
// Usa a geolocalização do navegador (ou coordenadas padrão)
// ============================================================

const Weather = {

  // Busca a localização do usuário e depois o clima
  async load(activityToday) {
    const card = document.getElementById('weatherCard');

    try {
      // Tenta obter a posição geográfica do usuário
      const position = await this.getPosition();
      const { latitude, longitude } = position.coords;

      // Chama a API Open-Meteo com as coordenadas
      const clima = await this.fetchClimate(latitude, longitude);
      this.render(card, clima, activityToday);

    } catch (erro) {
      // Se não conseguir a localização, usa Curitiba como padrão
      try {
        const clima = await this.fetchClimate(-25.4284, -49.2733);
        clima.city = 'Curitiba';
        this.render(card, clima, activityToday);
      } catch (e) {
        card.innerHTML = '<div class="weather-loading">Não foi possível carregar o clima.</div>';
      }
    }
  },

  // Retorna uma Promise com a posição GPS
  getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000
      });
    });
  },

  // Chama a API Open-Meteo e retorna os dados tratados
  async fetchClimate(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erro ao buscar clima');
    }

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;

    return {
      temp,
      condition: this.getCondition(code),
      emoji: this.getEmoji(code),
      isRaining: this.isRainingCode(code),
      city: 'Sua localização'
    };
  },

  // Interpreta o código de clima WMO
  getCondition(code) {
    if (code === 0) return 'Céu limpo';
    if (code <= 3) return 'Parcialmente nublado';
    if (code <= 49) return 'Nublado / neblina';
    if (code <= 69) return 'Chuva';
    if (code <= 79) return 'Neve';
    if (code <= 99) return 'Tempestade';
    return 'Desconhecido';
  },

  getEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 69) return '🌧️';
    if (code <= 79) return '❄️';
    if (code <= 99) return '⛈️';
    return '🌡️';
  },

  isRainingCode(code) {
    return code >= 50; // códigos 50+ = alguma precipitação
  },

  // Monta a mensagem contextual para o estudante
  buildMessage(activityToday, isRaining) {
    const chuva = isRaining ? ' Leve guarda-chuva!' : ' Tempo bom para sair.';

    if (!activityToday) {
      return '📚 Nenhuma atividade para hoje. Ótima chance para revisar os conteúdos!';
    }

    const tipo = activityToday.type;
    const titulo = activityToday.title;

    const prefixos = {
      prova: `📝 Você tem uma prova hoje: "${titulo}". Boa sorte!`,
      trabalho: `💼 Entrega de trabalho hoje: "${titulo}".`,
      atividade: `✅ Atividade para hoje: "${titulo}".`,
      apresentacao: `🎤 Apresentação hoje: "${titulo}". Respira fundo!`
    };

    return (prefixos[tipo] || `📌 Você tem "${titulo}" hoje.`) + chuva;
  },

  // Renderiza o clima no card
  render(card, clima, activityToday) {
    const mensagem = this.buildMessage(activityToday, clima.isRaining);

    card.innerHTML = `
      <div class="weather-content">
        <div class="weather-info">
          <div class="weather-temp">${clima.emoji} ${clima.temp}°C</div>
          <div class="weather-details">
            <span class="weather-condition">${clima.condition}</span>
            <span class="weather-location">📍 ${clima.city}</span>
          </div>
        </div>
        <div class="weather-divider"></div>
        <div class="weather-message">${mensagem}</div>
      </div>
    `;
  }

};
