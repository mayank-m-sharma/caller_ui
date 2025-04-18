import io from "socket.io-client";

let socket = null;

/**
 * Connects to the WebSocket server.
 * If an existing connection exists, it disconnects it before establishing a new one.
 *
 * @returns {Socket} The connected socket instance.
 */
export function connectSocket() {
  // Disconnect the existing socket if it exists and is connected
  if (socket && socket.connected) {
    socket.disconnect();
  }

  // Create a new socket connection
  socket = io("https://ghlsdk.textgrid.com", {
    transports: ["websocket"], // ⬅ Force only websocket
  });

  // Optional: add event listeners for debugging or connection events
  socket.on("connect", () => {
    console.log("Socket connected with id:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected.");
  });

  return socket;
}

/**
 * Emits a 'register-location' event to the server with the provided locationId.
 *
 * @param {string} locationId - The location identifier to register with the server.
 */
export function registerLocation(locationId) {
  if (!socket || !socket.connected) {
    console.error(
      "Socket is not connected. Please call connectSocket() first."
    );
    return;
  }

  // Emit the event with the provided locationId
  socket.emit("register-location", { locationId });
}
