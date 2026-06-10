# Syncoboard Go SDK WebRTC Guide

You are an agent building a Go application that requires WebRTC voice call signaling within the Syncoboard ecosystem. The Syncoboard monorepo provides a `ws` package in the `sdks/go` module to interface directly with the centralized Socket.io WebSocket service (`services/websocket`), rather than using REST API endpoints for signaling.

## Your Task

Utilize the `ws` package to establish a connection to the Syncoboard WebSocket server and handle WebRTC signaling (joins, leaves, and signal exchanges) for a specific board.

### Implementation Guidelines

1. **Initialization**: Create a new client instance using `ws.NewClient(websocketUrl)` and connect to the server via `Connect()`.
2. **Event Listeners**: Before or immediately after connecting, register callbacks using the following methods:
   - `OnVoiceJoin(func(peerId string))`: Triggered when another peer joins the board's voice call.
   - `OnVoiceLeave(func(peerId string))`: Triggered when another peer leaves.
   - `OnVoiceSignal(func(fromPeerId string, signal map[string]interface{}))`: Triggered when a peer sends a WebRTC signal targeted at your client.
3. **Actions**:
   - Use `JoinVoice(boardId, yourPeerId)` to announce your presence to a specific board's voice room.
   - Use `LeaveVoice(boardId, yourPeerId)` when disconnecting.
   - Use `SendSignal(targetPeerId, yourPeerId, signalData)` to transmit WebRTC SDP offers/answers or ICE candidates.
4. **Lifecycle**: Ensure you defer the `Close()` method on the client to clean up the ping ticker and connection smoothly.

### Example Code

```go
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/syncoboard/syncoboard/sdks/go/ws"
)

func main() {
	client := ws.NewClient("ws://localhost:3002")

	// 1. Setup event handlers
	client.OnVoiceJoin(func(peerId string) {
		log.Printf("Peer joined: %s", peerId)
	})

	client.OnVoiceLeave(func(peerId string) {
		log.Printf("Peer left: %s", peerId)
	})

	client.OnVoiceSignal(func(fromPeerId string, signal map[string]interface{}) {
		log.Printf("Received signal from %s: %v", fromPeerId, signal)
		// Process SDP or ICE candidates here
	})

	// 2. Connect
	if err := client.Connect(); err != nil {
		log.Fatalf("Failed to connect to websocket: %v", err)
	}
	defer client.Close()

	// 3. Join a specific board
	boardId := "board-123"
	myPeerId := "peer-456"

	if err := client.JoinVoice(boardId, myPeerId); err != nil {
		log.Fatalf("Failed to join voice: %v", err)
	}

	// 4. Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	// 5. Leave the board
	client.LeaveVoice(boardId, myPeerId)
	log.Println("Exiting...")
}
```
