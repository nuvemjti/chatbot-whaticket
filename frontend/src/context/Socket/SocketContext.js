import { createContext } from "react";
import openSocket from "socket.io-client";

class ManagedSocket {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.rawSocket = socketManager.currentSocket;
    this.callbacks = [];
  }
  
  on(event, callback) {
    if (event === "ready" || event === "connect") {
      return this.socketManager.onReady(callback);
    }
    this.callbacks.push({event, callback});
    return this.rawSocket.on(event, callback);
  }
  
  off(event, callback) {
    return this.rawSocket.off(event, callback);
  }
  
  emit(...params) {
    return this.rawSocket.emit(...params);
  }
  
  disconnect() {
    for (const c of this.callbacks) {
      this.rawSocket.off(c.event, c.callback);
    }
  }
}

class DummySocket {
  on(..._) {}
  off(..._) {}
  emit(..._) {}
  disconnect() {}
}

const SocketManager = {
  currentCompanyId: -1,
  currentUserId: -1,
  currentSocket: null,
  socketReady: false,

  getSocket: function(companyId) {
    let userId = null;
    if (localStorage.getItem("userId")) {
      userId = localStorage.getItem("userId");
    }

    if (companyId !== this.currentCompanyId || userId !== this.currentUserId) {
      if (this.currentSocket) {
        this.currentSocket.disconnect();
      }

      this.currentCompanyId = companyId;
      this.currentUserId = userId;
      let token = JSON.parse(localStorage.getItem("token"));
      
      if (!token) {
        return new DummySocket();
      }
      
      this.currentSocket = openSocket(process.env.REACT_APP_BACKEND_URL, {
        transports: ["websocket"],
        pingTimeout: 18000,
        pingInterval: 18000,
        query: { token },
      });
      
      this.currentSocket.onAny((event, ...args) => {
        console.debug("Event: ", event, "\nArg[0] ", args[0]);
      });
      
      this.onReady(() => {
        this.socketReady = true;
      });

    }
    
    return new ManagedSocket(this);
  },
  
  onReady: function( callbackReady ) {
    if (this.socketReady) {
      callbackReady();
      return
    }
    
    const callAndRemoveOnReady = () => {
      callbackReady();
      this.currentSocket.off("ready", callAndRemoveOnReady);
    };
    
    this.currentSocket.on("ready", callAndRemoveOnReady);
  },

};

const SocketContext = createContext()

export { SocketContext, SocketManager };
