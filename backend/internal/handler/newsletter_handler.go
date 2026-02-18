package handler

import (
	"errors"
	"net/http"
	"strconv"

	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/service"

	"github.com/gin-gonic/gin"
)

type NewsletterHandler struct {
	newsletterService *service.NewsletterService
}

func NewNewsletterHandler(newsletterService *service.NewsletterService) *NewsletterHandler {
	return &NewsletterHandler{newsletterService: newsletterService}
}

func (h *NewsletterHandler) Subscribe(c *gin.Context) {
	var req dto.SubscribeNewsletterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Please provide a valid email address",
		})
		return
	}

	sub, err := h.newsletterService.Subscribe(c.Request.Context(), req.Email)
	if err != nil {
		if errors.Is(err, domain.ErrNewsletterAlreadySubscribed) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error":   "This email is already subscribed to our newsletter",
			})
			return
		}
		if errors.Is(err, domain.ErrNewsletterEmailRequired) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Email is required",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to subscribe. Please try again later.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully subscribed to newsletter",
		"data":    dto.ToNewsletterSubscriptionResponse(sub),
	})
}

func (h *NewsletterHandler) Unsubscribe(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid unsubscribe link",
		})
		return
	}

	err := h.newsletterService.Unsubscribe(c.Request.Context(), token)
	if err != nil {
		if errors.Is(err, domain.ErrNewsletterInvalidToken) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Invalid or expired unsubscribe link",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to unsubscribe. Please try again later.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully unsubscribed from newsletter",
	})
}

func (h *NewsletterHandler) GetSubscribers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	subs, total, err := h.newsletterService.GetSubscribers(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch subscribers",
		})
		return
	}

	responses := make([]dto.NewsletterSubscriptionResponse, len(subs))
	for i, sub := range subs {
		responses[i] = dto.ToNewsletterSubscriptionResponse(sub)
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"subscribers": responses,
			"total":       total,
			"page":        page,
			"per_page":    limit,
			"total_pages": totalPages,
		},
	})
}
