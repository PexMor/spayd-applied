class WebSocketManager {
    constructor() {
        this.ws = null;
        this.listeners = new Set();
        this.reconnectInterval = 3000;
        this.reconnectTimer = null;
        this.isIntentionallyClosed = false;
    }

    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        this.isIntentionallyClosed = false;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.notifyListeners({ type: 'connected' });

                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.notifyListeners(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyListeners({ type: 'error', error });
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.notifyListeners({ type: 'disconnected' });

                if (!this.isIntentionallyClosed) {
                    // Attempt to reconnect
                    this.reconnectTimer = setTimeout(() => {
                        this.connect();
                    }, this.reconnectInterval);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
        }
    }

    disconnect() {
        this.isIntentionallyClosed = true;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in WebSocket listener:', error);
            }
        });
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not connected');
        }
    }
    
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

export const wsManager = new WebSocketManager();

export default wsManager;
