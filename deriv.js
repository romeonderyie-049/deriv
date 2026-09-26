const WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089";

export function connectToDeriv(symbol, onTick, onStatus, onError) {
  const socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    onStatus("connected");

    socket.send(
      JSON.stringify({
        ticks: symbol,
        subscribe: 1
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        onError(data.error.message || "Deriv returned an error.");
        return;
      }

      if (data.tick) {
        onTick({
          quote: data.tick.quote,
          symbol: data.tick.symbol,
          epoch: data.tick.epoch
        });
      }
    } catch {
      onError("Unable to read Deriv data.");
    }
  };

  socket.onerror = () => {
    onError("WebSocket connection error.");
    onStatus("error");
  };

  socket.onclose = () => {
    onStatus("disconnected");
  };

  return {
    close() {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    }
  };
  }
