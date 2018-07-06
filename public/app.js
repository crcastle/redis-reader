/* global WebSocket, location */
(() => {
  const messages = document.querySelector('#messages');
  const wsButton = document.querySelector('#wsButton');

  const showMessage = (message) => {
    messages.textContent += `\n${message}`;
    messages.scrollTop = messages.scrollHeight;
  };

  let ws;

  wsButton.onclick = () => {
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    ws = new WebSocket(`ws://${location.host}`);
    ws.onerror = () => showMessage('-----> WebSocket error');
    ws.onopen = () => showMessage('-----> WebSocket connection established');
    ws.onclose = () => showMessage('-----> WebSocket connection closed');
    ws.onmessage = event => showMessage(event.data);
  };
})();
