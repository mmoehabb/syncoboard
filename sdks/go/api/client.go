package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// APIError represents an error returned by the API.
type APIError struct {
	Message string `json:"error"`
}

func (e *APIError) Error() string {
	return e.Message
}

// Client represents the Syncoboard API client.
type Client struct {
	BaseURL    string
	Token      string
	HTTPClient *http.Client

	Admin        *AdminService
	Board        *BoardService
	Bug          *BugService
	Directory    *DirectoryService
	Github       *GithubService
	Notification *NotificationService
	Subscription *SubscriptionService
	Task         *TaskService
	User         *UserService
	Workspace    *WorkspaceService
}

// NewClient creates a new API client.
func NewClient(baseURL, token string) *Client {
	if baseURL == "" {
		baseURL = "https://syncoboard.com/api"
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	c := &Client{
		BaseURL:    baseURL,
		Token:      token,
		HTTPClient: &http.Client{},
	}

	c.Admin = &AdminService{client: c}
	c.Board = &BoardService{client: c}
	c.Bug = &BugService{client: c}
	c.Directory = &DirectoryService{client: c}
	c.Github = &GithubService{client: c}
	c.Notification = &NotificationService{client: c}
	c.Subscription = &SubscriptionService{client: c}
	c.Task = &TaskService{client: c}
	c.User = &UserService{client: c}
	c.Workspace = &WorkspaceService{client: c}

	return c
}

// doRequest performs an HTTP request to the API.
func (c *Client) doRequest(method, endpoint string, body interface{}, out interface{}) error {
	url := fmt.Sprintf("%s%s", c.BaseURL, endpoint)

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.Token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		var apiErr APIError
		if err := json.Unmarshal(respBody, &apiErr); err == nil && apiErr.Message != "" {
			return &apiErr
		}
		return fmt.Errorf("API error: status code %d, body: %s", resp.StatusCode, string(respBody))
	}

	if out != nil {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}
