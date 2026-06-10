package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Socket.io standard packet types
const (
	EngineIoOpen    = "0"
	EngineIoClose   = "1"
	EngineIoPing    = "2"
	EngineIoPong    = "3"
	EngineIoMessage = "4"

	SocketIoConnect     = "0"
	SocketIoDisconnect  = "1"
	SocketIoEvent       = "2"
	SocketIoAck         = "3"
	SocketIoError       = "4"
	SocketIoBinaryEvent = "5"
	SocketIoBinaryAck   = "6"
)

// Client represents a Socket.io websocket connection wrapper for Syncoboard's WebRTC signaling
type Client struct {
	conn       *websocket.Conn
	url        string
	mu         sync.Mutex
	onJoin     func(peerId string)
	onLeave    func(peerId string)
	onSignal   func(fromPeerId string, signal map[string]interface{})
	done       chan struct{}
	pingTicker *time.Ticker
}

// NewClient creates a new WebSocket client
// websocketUrl should be the base URL to the websocket server, e.g., "ws://localhost:3002"
func NewClient(websocketUrl string) *Client {
	return &Client{
		url:  websocketUrl,
		done: make(chan struct{}),
	}
}

// Connect establishes the Socket.io connection and starts the read loop
func (c *Client) Connect() error {
	u, err := url.Parse(c.url)
	if err != nil {
		return err
	}

	// Socket.io v4 path
	u.Path = "/socket.io/"
	q := u.Query()
	q.Set("EIO", "4")
	q.Set("transport", "websocket")
	u.RawQuery = q.Encode()

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return fmt.Errorf("failed to dial websocket: %w", err)
	}

	c.conn = conn

	// Initial message from Engine.IO should be Open (0)
	_, message, err := c.conn.ReadMessage()
	if err != nil {
		return fmt.Errorf("failed to read initial Engine.IO message: %w", err)
	}

	if len(message) < 1 || string(message[0]) != EngineIoOpen {
		return fmt.Errorf("expected Engine.IO open packet, got: %s", string(message))
	}

	// Parse ping interval from the open packet
	var openData struct {
		PingInterval int `json:"pingInterval"`
		PingTimeout  int `json:"pingTimeout"`
	}
	if err := json.Unmarshal(message[1:], &openData); err != nil {
		// Default to 25s if parsing fails
		openData.PingInterval = 25000
	}

	c.pingTicker = time.NewTicker(time.Duration(openData.PingInterval) * time.Millisecond)

	// Start go routines for heartbeats and message reading
	go c.heartbeat()
	go c.readLoop()

	return nil
}

// Close gracefully closes the websocket connection
func (c *Client) Close() {
	if c.pingTicker != nil {
		c.pingTicker.Stop()
	}
	close(c.done)
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn != nil {
		c.conn.WriteMessage(websocket.TextMessage, []byte(EngineIoClose))
		c.conn.Close()
	}
}

func (c *Client) heartbeat() {
	for {
		select {
		case <-c.done:
			return
		case <-c.pingTicker.C:
			c.mu.Lock()
			if c.conn != nil {
				c.conn.WriteMessage(websocket.TextMessage, []byte(EngineIoPing))
			}
			c.mu.Unlock()
		}
	}
}

func (c *Client) readLoop() {
	for {
		select {
		case <-c.done:
			return
		default:
			_, message, err := c.conn.ReadMessage()
			if err != nil {
				log.Printf("read error: %v", err)
				c.Close()
				return
			}

			if len(message) < 1 {
				continue
			}

			engineType := string(message[0])
			if engineType == EngineIoMessage {
				if len(message) < 2 {
					continue
				}
				socketType := string(message[1])

				if socketType == SocketIoEvent {
					c.handleSocketIoEvent(message[2:])
				}
			}
		}
	}
}

func (c *Client) handleSocketIoEvent(data []byte) {
	var eventData []interface{}
	if err := json.Unmarshal(data, &eventData); err != nil {
		log.Printf("error unmarshaling event data: %v", err)
		return
	}

	if len(eventData) == 0 {
		return
	}

	eventName, ok := eventData[0].(string)
	if !ok {
		return
	}

	switch eventName {
	case "voice_join":
		if len(eventData) > 1 && c.onJoin != nil {
			if payload, ok := eventData[1].(map[string]interface{}); ok {
				if peerId, ok := payload["peerId"].(string); ok {
					c.onJoin(peerId)
				}
			}
		}
	case "voice_leave":
		if len(eventData) > 1 && c.onLeave != nil {
			if payload, ok := eventData[1].(map[string]interface{}); ok {
				if peerId, ok := payload["peerId"].(string); ok {
					c.onLeave(peerId)
				}
			}
		}
	case "voice_signal":
		if len(eventData) > 1 && c.onSignal != nil {
			if payload, ok := eventData[1].(map[string]interface{}); ok {
				peerId, _ := payload["peerId"].(string)
				signal, _ := payload["signal"].(map[string]interface{})
				c.onSignal(peerId, signal)
			}
		}
	}
}

// emit sends a Socket.io event over the Engine.IO message transport
func (c *Client) emit(event string, args ...interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	payload := make([]interface{}, 0, len(args)+1)
	payload = append(payload, event)
	payload = append(payload, args...)

	dataBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	msg := EngineIoMessage + SocketIoEvent + string(dataBytes)
	return c.conn.WriteMessage(websocket.TextMessage, []byte(msg))
}

// JoinVoice Call a specific board's voice channel
func (c *Client) JoinVoice(boardId, peerId string) error {
	return c.emit("voice_join", boardId, peerId)
}

// LeaveVoice Leaves a specific board's voice channel
func (c *Client) LeaveVoice(boardId, peerId string) error {
	return c.emit("voice_leave", boardId, peerId)
}

// SendSignal Sends a WebRTC signal to a specific peer
func (c *Client) SendSignal(toPeerId, fromPeerId string, signal map[string]interface{}) error {
	return c.emit("voice_signal", map[string]interface{}{
		"toPeerId":   toPeerId,
		"fromPeerId": fromPeerId,
		"signal":     signal,
	})
}

// OnVoiceJoin Registers a callback for when a peer joins the board's voice channel
func (c *Client) OnVoiceJoin(callback func(peerId string)) {
	c.onJoin = callback
}

// OnVoiceLeave Registers a callback for when a peer leaves the board's voice channel
func (c *Client) OnVoiceLeave(callback func(peerId string)) {
	c.onLeave = callback
}

// OnVoiceSignal Registers a callback for receiving WebRTC signals from other peers
func (c *Client) OnVoiceSignal(callback func(fromPeerId string, signal map[string]interface{})) {
	c.onSignal = callback
}
