package api

import (
	"fmt"
	"net/url"
	"strconv"
	"time"
)

type AdminService struct {
	client *Client
}

type AdminLoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
}

type AdminLoginResponse struct {
	AccessToken string `json:"accessToken"`
}

type AdminUser struct {
	ID             string     `json:"id"`
	Name           *string    `json:"name"`
	Email          *string    `json:"email"`
	CreatedAt      time.Time  `json:"createdAt"`
	WorkspaceCount int        `json:"workspaceCount"`
	BoardCount     int        `json:"boardCount"`
	LastOnline     *time.Time `json:"lastOnline"`
}

type Plan struct {
	ID                    string    `json:"id"`
	Name                  string    `json:"name"`
	MaxWorkspaces         int       `json:"maxWorkspaces"`
	MaxBoardsPerWorkspace int       `json:"maxBoardsPerWorkspace"`
	MaxMembersPerBoard    int       `json:"maxMembersPerBoard"`
	MaxActiveBoards       int       `json:"maxActiveBoards"`
	IsTrial               bool      `json:"isTrial"`
	IsActive              bool      `json:"isActive"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type AdminPlanCreateRequest struct {
	Name                  string `json:"name"`
	MaxWorkspaces         *int   `json:"maxWorkspaces,omitempty"`
	MaxBoardsPerWorkspace *int   `json:"maxBoardsPerWorkspace,omitempty"`
	MaxMembersPerBoard    *int   `json:"maxMembersPerBoard,omitempty"`
	MaxActiveBoards       *int   `json:"maxActiveBoards,omitempty"`
	IsTrial               *bool  `json:"isTrial,omitempty"`
	IsActive              *bool  `json:"isActive,omitempty"`
}

type AdminPlanUpdateRequest struct {
	Name                  *string `json:"name,omitempty"`
	MaxWorkspaces         *int    `json:"maxWorkspaces,omitempty"`
	MaxBoardsPerWorkspace *int    `json:"maxBoardsPerWorkspace,omitempty"`
	MaxMembersPerBoard    *int    `json:"maxMembersPerBoard,omitempty"`
	MaxActiveBoards       *int    `json:"maxActiveBoards,omitempty"`
	IsTrial               *bool   `json:"isTrial,omitempty"`
	IsActive              *bool   `json:"isActive,omitempty"`
}

type AdminChangePasswordRequest struct {
	CurrentPassword *string `json:"currentPassword,omitempty"`
	NewPassword     *string `json:"newPassword,omitempty"`
}

type AdminChangePasswordResponse struct {
	Success bool `json:"success"`
}

type BugReport struct {
	ID        string    `json:"id"`
	Message   string    `json:"message"`
	Browser   string    `json:"browser"`
	CreatedAt time.Time `json:"createdAt"`
}

type BugReportsResponse struct {
	Data  []BugReport `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

func (s *AdminService) Login(req AdminLoginRequest) (*AdminLoginResponse, error) {
	var resp AdminLoginResponse
	err := s.client.doRequest("POST", "/admin/auth", req, &resp)
	return &resp, err
}

func (s *AdminService) GetUsers() ([]AdminUser, error) {
	var resp []AdminUser
	err := s.client.doRequest("GET", "/admin/users", nil, &resp)
	return resp, err
}

func (s *AdminService) GetPlans() ([]Plan, error) {
	var resp []Plan
	err := s.client.doRequest("GET", "/admin/plans", nil, &resp)
	return resp, err
}

func (s *AdminService) CreatePlan(req AdminPlanCreateRequest) (*Plan, error) {
	var resp Plan
	err := s.client.doRequest("POST", "/admin/plans", req, &resp)
	return &resp, err
}

func (s *AdminService) UpdatePlan(id string, req AdminPlanUpdateRequest) (*Plan, error) {
	var resp Plan
	endpoint := fmt.Sprintf("/admin/plans/%s", url.PathEscape(id))
	err := s.client.doRequest("PUT", endpoint, req, &resp)
	return &resp, err
}

func (s *AdminService) GetBugReports(page, limit *int, search *string) (*BugReportsResponse, error) {
	q := url.Values{}
	if page != nil {
		q.Add("page", strconv.Itoa(*page))
	}
	if limit != nil {
		q.Add("limit", strconv.Itoa(*limit))
	}
	if search != nil {
		q.Add("search", *search)
	}

	endpoint := "/admin/reports"
	if len(q) > 0 {
		endpoint += "?" + q.Encode()
	}

	var resp BugReportsResponse
	err := s.client.doRequest("GET", endpoint, nil, &resp)
	return &resp, err
}

func (s *AdminService) ChangePassword(req AdminChangePasswordRequest) (*AdminChangePasswordResponse, error) {
	var resp AdminChangePasswordResponse
	err := s.client.doRequest("POST", "/admin/auth/password", req, &resp)
	return &resp, err
}
