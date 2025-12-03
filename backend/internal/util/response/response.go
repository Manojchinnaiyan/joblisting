package response

import (
	"net/http"
	"strings"

	"job-platform/internal/domain"

	"github.com/gin-gonic/gin"
)

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Success bool       `json:"success"`
	Error   ErrorDetail `json:"error"`
}

// ErrorDetail contains error details
type ErrorDetail struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Success bool           `json:"success"`
	Message string         `json:"message"`
	Data    interface{}    `json:"data"`
	Meta    PaginationMeta `json:"meta"`
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	CurrentPage int   `json:"current_page"`
	PerPage     int   `json:"per_page"`
	Total       int64 `json:"total"`
	TotalPages  int   `json:"total_pages"`
}

// Success sends a successful JSON response
func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error sends an error JSON response
func Error(c *gin.Context, statusCode int, err error, details interface{}) {
	code := domain.GetErrorCode(err)
	if code == "UNKNOWN" {
		code = "INTERNAL_ERROR"
	}

	// Extract clean message by removing error code prefix
	message := err.Error()
	if idx := strings.Index(message, ": "); idx != -1 {
		message = message[idx+2:] // Remove "CODE: " prefix
	}

	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

// Paginated sends a paginated JSON response
func Paginated(c *gin.Context, message string, data interface{}, meta PaginationMeta) {
	c.JSON(http.StatusOK, PaginatedResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

// BadRequest sends a 400 bad request response
func BadRequest(c *gin.Context, err error) {
	Error(c, http.StatusBadRequest, err, nil)
}

// Unauthorized sends a 401 unauthorized response
func Unauthorized(c *gin.Context, err error) {
	Error(c, http.StatusUnauthorized, err, nil)
}

// Forbidden sends a 403 forbidden response
func Forbidden(c *gin.Context, err error) {
	Error(c, http.StatusForbidden, err, nil)
}

// NotFound sends a 404 not found response
func NotFound(c *gin.Context, err error) {
	Error(c, http.StatusNotFound, err, nil)
}

// InternalError sends a 500 internal server error response
func InternalError(c *gin.Context, err error) {
	Error(c, http.StatusInternalServerError, err, nil)
}

// Created sends a 201 created response
func Created(c *gin.Context, message string, data interface{}) {
	Success(c, http.StatusCreated, message, data)
}

// OK sends a 200 OK response
func OK(c *gin.Context, message string, data interface{}) {
	Success(c, http.StatusOK, message, data)
}

// NoContent sends a 204 no content response
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}
