package storage

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioConfig holds MinIO configuration
type MinioConfig struct {
	Endpoint        string
	AccessKey       string
	SecretKey       string
	UseSSL          bool
	PublicURL       string // External URL for accessing files (e.g., http://localhost:9000)
	BucketResumes   string
	BucketAvatars   string
	BucketCerts     string
	BucketPortfolio string
	BucketCompanies string
}

// MinioClient wraps minio.Client with custom methods
type MinioClient struct {
	client *minio.Client
	config *MinioConfig
}

// UploadResult contains upload information
type UploadResult struct {
	Bucket      string
	Path        string
	Size        int64
	ContentType string
	URL         string
}

// FileInfo contains file metadata
type FileInfo struct {
	Size         int64
	LastModified time.Time
	ContentType  string
	ETag         string
}

// NewMinioClient creates a new MinIO client
func NewMinioClient(config *MinioConfig) (*MinioClient, error) {
	client, err := minio.New(config.Endpoint, &minio.Options{
		Creds:        credentials.NewStaticV4(config.AccessKey, config.SecretKey, ""),
		Secure:       config.UseSSL,
		Region:       "us-east-1",
		BucketLookup: minio.BucketLookupPath, // Force path-style access for Docker/local MinIO
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	return &MinioClient{
		client: client,
		config: config,
	}, nil
}

// InitBuckets creates all required buckets if they don't exist
func (m *MinioClient) InitBuckets() error {
	buckets := []string{
		m.config.BucketResumes,
		m.config.BucketAvatars,
		m.config.BucketCerts,
		m.config.BucketPortfolio,
		m.config.BucketCompanies,
	}

	for _, bucket := range buckets {
		if err := m.EnsureBucket(bucket); err != nil {
			return fmt.Errorf("failed to ensure bucket %s: %w", bucket, err)
		}
	}

	return nil
}

// EnsureBucket creates a bucket if it doesn't exist
func (m *MinioClient) EnsureBucket(bucketName string) error {
	ctx := context.Background()

	exists, err := m.client.BucketExists(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = m.client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	return nil
}

// UploadFile uploads a multipart file to MinIO
func (m *MinioClient) UploadFile(bucket string, file *multipart.FileHeader, path string) (*UploadResult, error) {
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	info, err := m.client.PutObject(
		context.Background(),
		bucket,
		path,
		src,
		file.Size,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Construct the public URL
	publicURL := m.GetPublicURL(bucket, path)

	return &UploadResult{
		Bucket:      bucket,
		Path:        path,
		Size:        info.Size,
		ContentType: contentType,
		URL:         publicURL,
	}, nil
}

// UploadFromReader uploads content from an io.Reader
func (m *MinioClient) UploadFromReader(bucket, path string, reader io.Reader, size int64, contentType string) (*UploadResult, error) {
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	info, err := m.client.PutObject(
		context.Background(),
		bucket,
		path,
		reader,
		size,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upload from reader: %w", err)
	}

	// Construct the public URL
	publicURL := m.GetPublicURL(bucket, path)

	return &UploadResult{
		Bucket:      bucket,
		Path:        path,
		Size:        info.Size,
		ContentType: contentType,
		URL:         publicURL,
	}, nil
}

// GetSignedURL generates a presigned URL for downloading a file
func (m *MinioClient) GetSignedURL(bucket, path string, expiry time.Duration) (string, error) {
	// Generate the presigned URL using internal MinIO endpoint
	// The signature is based on the bucket/path which nginx proxies directly
	url, err := m.client.PresignedGetObject(
		context.Background(),
		bucket,
		path,
		expiry,
		nil,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	// If PublicURL is configured, replace the internal hostname with public URL
	// The path stays the same (e.g., /resumes/user-id/file.pdf) so signature remains valid
	// Nginx proxies /{bucket}/... directly to MinIO with Host header set to minio:9000
	if m.config.PublicURL != "" {
		urlStr := url.String()
		// Replace internal endpoint with public URL
		// Internal: http://minio:9000/resumes/path/file.pdf?signature...
		// Public:   https://jobsworld.in/resumes/path/file.pdf?signature...
		internalBase := fmt.Sprintf("http://%s", m.config.Endpoint)
		if m.config.UseSSL {
			internalBase = fmt.Sprintf("https://%s", m.config.Endpoint)
		}
		urlStr = strings.Replace(urlStr, internalBase, m.config.PublicURL, 1)
		return urlStr, nil
	}

	return url.String(), nil
}

// GetFileInfo retrieves file metadata
func (m *MinioClient) GetFileInfo(bucket, path string) (*FileInfo, error) {
	info, err := m.client.StatObject(
		context.Background(),
		bucket,
		path,
		minio.StatObjectOptions{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	return &FileInfo{
		Size:         info.Size,
		LastModified: info.LastModified,
		ContentType:  info.ContentType,
		ETag:         info.ETag,
	}, nil
}

// DeleteFile deletes a single file from MinIO
func (m *MinioClient) DeleteFile(bucket, path string) error {
	err := m.client.RemoveObject(
		context.Background(),
		bucket,
		path,
		minio.RemoveObjectOptions{},
	)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// DeleteFiles deletes multiple files from MinIO
func (m *MinioClient) DeleteFiles(bucket string, paths []string) error {
	objectsCh := make(chan minio.ObjectInfo)

	go func() {
		defer close(objectsCh)
		for _, path := range paths {
			objectsCh <- minio.ObjectInfo{
				Key: path,
			}
		}
	}()

	errorCh := m.client.RemoveObjects(context.Background(), bucket, objectsCh, minio.RemoveObjectsOptions{})

	for err := range errorCh {
		if err.Err != nil {
			return fmt.Errorf("failed to delete file %s: %w", err.ObjectName, err.Err)
		}
	}

	return nil
}

// GetConfig returns the MinIO configuration
func (m *MinioClient) GetConfig() *MinioConfig {
	return m.config
}

// GetPublicURL constructs a public URL for accessing a file
func (m *MinioClient) GetPublicURL(bucket, path string) string {
	// Use PublicURL if configured, otherwise construct from endpoint
	baseURL := m.config.PublicURL
	if baseURL == "" {
		protocol := "http"
		if m.config.UseSSL {
			protocol = "https"
		}
		baseURL = fmt.Sprintf("%s://%s", protocol, m.config.Endpoint)
	}
	return fmt.Sprintf("%s/%s/%s", baseURL, bucket, path)
}

// ValidateFile validates a file against allowed types and size limits
func (m *MinioClient) ValidateFile(file *multipart.FileHeader, allowedTypes []string, maxSizeMB int64) error {
	// Check file size
	maxBytes := maxSizeMB * 1024 * 1024
	if file.Size > maxBytes {
		return fmt.Errorf("file size %d bytes exceeds maximum of %d MB", file.Size, maxSizeMB)
	}

	// Check file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != "" && ext[0] == '.' {
		ext = ext[1:]
	}

	allowed := false
	for _, allowedType := range allowedTypes {
		if ext == strings.ToLower(allowedType) {
			allowed = true
			break
		}
	}

	if !allowed {
		return fmt.Errorf("file type %s not allowed. allowed types: %v", ext, allowedTypes)
	}

	return nil
}

// GenerateUniqueFileName generates a sanitized filename (without UUID prefix)
// The UUID is added in the path structure instead for cleaner filenames
func GenerateUniqueFileName(originalName string) string {
	ext := filepath.Ext(originalName)
	name := strings.TrimSuffix(originalName, ext)

	// Sanitize filename
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			return r
		}
		return -1
	}, name)

	// Limit length
	if len(name) > 50 {
		name = name[:50]
	}

	return fmt.Sprintf("%s%s", name, ext)
}

// GenerateFilePath generates an organized file path with date hierarchy and UUID
// Structure: {userID}/{year}/{month}/{uuid}/{filename}
// The UUID in the path ensures uniqueness while keeping the filename clean
// The bucket is not included in the path as it's passed separately to MinIO
func GenerateFilePath(userID uuid.UUID, filename string) string {
	now := time.Now()
	year := now.Format("2006")
	month := now.Format("01")
	fileUUID := uuid.New().String()

	return fmt.Sprintf("%s/%s/%s/%s/%s", userID.String(), year, month, fileUUID, filename)
}
