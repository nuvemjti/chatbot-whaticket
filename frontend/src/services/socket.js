import openSocket from "socket.io-client";
import { isObject } from "lodash";

export function socketConnection(params) {
  let token = null;
  if (localStorage.getItem("token")) {
    token = JSON.parse(localStorage.getItem("token"));
  }
  
  if (!token) {
    return null;
  }
  
  return openSocket(process.env.REACT_APP_BACKEND_URL, {
    transports: ["websocket"],
    pingTimeout: 18000,
    pingInterval: 18000,
    query: { token },
  });
}
