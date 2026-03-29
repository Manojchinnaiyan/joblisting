package handler

import (
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ChatHandler handles AI chat requests
type ChatHandler struct {
	chatService *service.ChatService
}

// NewChatHandler creates a new chat handler
func NewChatHandler(chatService *service.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

type sendMessageRequest struct {
	Message string                  `json:"message" binding:"required"`
	History []service.ChatMessage   `json:"history"`
}

// SendMessage processes a chat message and returns a reply with optional job matches
func (h *ChatHandler) SendMessage(c *gin.Context) {
	var req sendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if len(req.Message) > 2000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message too long (max 2000 characters)"})
		return
	}

	// Cap history to last 10 turns to avoid token bloat
	history := req.History
	if len(history) > 10 {
		history = history[len(history)-10:]
	}

	result, err := h.chatService.ProcessMessage(c.Request.Context(), req.Message, history)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Message processed", result)
}
