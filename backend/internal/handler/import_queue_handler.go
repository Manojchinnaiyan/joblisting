package handler

import (
	"context"
	"net/http"

	"job-platform/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ImportQueueHandler handles import queue operations
type ImportQueueHandler struct {
	importQueueService *service.ImportQueueService
}

// NewImportQueueHandler creates a new import queue handler
func NewImportQueueHandler(importQueueService *service.ImportQueueService) *ImportQueueHandler {
	return &ImportQueueHandler{
		importQueueService: importQueueService,
	}
}

// CreateQueueRequest represents the request to create an import queue
type CreateQueueRequest struct {
	SourceURL string   `json:"source_url"`
	URLs      []string `json:"urls" binding:"required"`
	Titles    []string `json:"titles"`
}

// CreateQueue creates a new import queue and starts processing
func (h *ImportQueueHandler) CreateQueue(c *gin.Context) {
	// Get admin user from context
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	adminID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	var req CreateQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if len(req.URLs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No URLs provided"})
		return
	}

	// Create the queue with admin ID
	queue := h.importQueueService.CreateQueue(adminID, req.SourceURL, req.URLs, req.Titles)

	// Start processing in background
	ctx := context.Background()
	h.importQueueService.StartQueue(ctx, queue.ID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"queue":   queue,
	})
}

// GetQueue returns a specific queue by ID
func (h *ImportQueueHandler) GetQueue(c *gin.Context) {
	queueID := c.Param("id")
	if queueID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Queue ID required"})
		return
	}

	queue := h.importQueueService.GetQueue(queueID)
	if queue == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Queue not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"queue":   queue,
	})
}

// GetAllQueues returns all queues
func (h *ImportQueueHandler) GetAllQueues(c *gin.Context) {
	queues := h.importQueueService.GetAllQueues()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"queues":  queues,
	})
}

// CancelQueue cancels a running queue
func (h *ImportQueueHandler) CancelQueue(c *gin.Context) {
	queueID := c.Param("id")
	if queueID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Queue ID required"})
		return
	}

	if h.importQueueService.CancelQueue(queueID) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Queue cancelled",
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot cancel queue (not found or not running)",
		})
	}
}

// CancelJobRequest represents the request to cancel a specific job
type CancelJobRequest struct {
	JobID string `json:"job_id" binding:"required"`
}

// CancelJob cancels a specific pending job
func (h *ImportQueueHandler) CancelJob(c *gin.Context) {
	queueID := c.Param("id")
	if queueID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Queue ID required"})
		return
	}

	var req CancelJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if h.importQueueService.CancelJob(queueID, req.JobID) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Job cancelled",
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot cancel job (not found or not pending)",
		})
	}
}

// DeleteQueue removes a completed/cancelled queue
func (h *ImportQueueHandler) DeleteQueue(c *gin.Context) {
	queueID := c.Param("id")
	if queueID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Queue ID required"})
		return
	}

	if h.importQueueService.DeleteQueue(queueID) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Queue deleted",
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete queue (not found or still processing)",
		})
	}
}

// StartExtractionRequest represents the request to start link extraction
type StartExtractionRequest struct {
	URL string `json:"url" binding:"required"`
}

// StartExtraction starts a background link extraction task
func (h *ImportQueueHandler) StartExtraction(c *gin.Context) {
	var req StartExtractionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL is required"})
		return
	}

	// Start extraction in background
	task := h.importQueueService.StartLinkExtraction(req.URL)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"task":    task,
	})
}

// GetExtractionTask returns a specific extraction task by ID
func (h *ImportQueueHandler) GetExtractionTask(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID required"})
		return
	}

	task := h.importQueueService.GetExtractionTask(taskID)
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"task":    task,
	})
}

// GetAllExtractionTasks returns all extraction tasks
func (h *ImportQueueHandler) GetAllExtractionTasks(c *gin.Context) {
	tasks := h.importQueueService.GetAllExtractionTasks()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"tasks":   tasks,
	})
}

// DeleteExtractionTask removes an extraction task
func (h *ImportQueueHandler) DeleteExtractionTask(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID required"})
		return
	}

	if h.importQueueService.DeleteExtractionTask(taskID) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Task deleted",
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete task (not found or still processing)",
		})
	}
}
