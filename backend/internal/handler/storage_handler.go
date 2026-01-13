package handler

import (
	"io"
	"net/http"
	"strings"

	"job-platform/internal/storage"

	"github.com/gin-gonic/gin"
)

type StorageHandler struct {
	minioClient *storage.MinioClient
}

func NewStorageHandler(minioClient *storage.MinioClient) *StorageHandler {
	return &StorageHandler{
		minioClient: minioClient,
	}
}

// ServeFile serves a file from MinIO storage
// Route: GET /storage/:bucket/*path
func (h *StorageHandler) ServeFile(c *gin.Context) {
	bucket := c.Param("bucket")
	path := c.Param("path")

	// Remove leading slash from path
	if len(path) > 0 && path[0] == '/' {
		path = path[1:]
	}

	// Fix legacy paths that have duplicate bucket name in path
	// e.g., path "avatars/user-id/file.png" when bucket is "avatars" should be "user-id/file.png"
	if strings.HasPrefix(path, bucket+"/") {
		path = strings.TrimPrefix(path, bucket+"/")
	}

	if bucket == "" || path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// Get file info to set content type
	fileInfo, err := h.minioClient.GetFileInfo(bucket, path)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Get the file from MinIO
	object, err := h.minioClient.GetObject(bucket, path)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}
	defer object.Close()

	// Set headers
	c.Header("Content-Type", fileInfo.ContentType)
	c.Header("Cache-Control", "public, max-age=31536000") // Cache for 1 year

	// Stream the file
	c.Status(http.StatusOK)
	io.Copy(c.Writer, object)
}
