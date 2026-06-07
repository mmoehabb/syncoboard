package api

import (
	"fmt"
	"net/url"
)

type WorkspaceService struct {
	client *Client
}

type Workspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type WorkspaceWithBoards struct {
	Workspace
	Boards []interface{} `json:"boards"`
}

type CreateWorkspacePayload struct {
	Name string `json:"name"`
}

func (s *WorkspaceService) GetUserWorkspaces(includeBoards bool) (interface{}, error) {
	endpoint := "/workspaces"
	if includeBoards {
		endpoint += "?includeBoards=true"
	} else {
		endpoint += "?includeBoards=false"
	}

	var resp struct {
		Workspaces interface{} `json:"workspaces"`
	}
	err := s.client.doRequest("GET", endpoint, nil, &resp)
	return resp.Workspaces, err
}

func (s *WorkspaceService) CreateWorkspace(payload CreateWorkspacePayload) (*Workspace, error) {
	var resp struct {
		Workspace Workspace `json:"workspace"`
	}
	err := s.client.doRequest("POST", "/workspaces", payload, &resp)
	return &resp.Workspace, err
}

func (s *WorkspaceService) DeleteWorkspace(workspaceName string) (*GenericMessageResponse, error) {
	endpoint := fmt.Sprintf("/workspaces?workspace=%s", url.QueryEscape(workspaceName))
	var resp GenericMessageResponse
	err := s.client.doRequest("DELETE", endpoint, nil, &resp)
	return &resp, err
}

func (s *WorkspaceService) RestoreWorkspace(workspaceName string) (*GenericMessageResponse, error) {
	endpoint := fmt.Sprintf("/workspaces/restore?workspace=%s", url.QueryEscape(workspaceName))
	var resp GenericMessageResponse
	err := s.client.doRequest("PUT", endpoint, nil, &resp)
	return &resp, err
}

func (s *WorkspaceService) UpdateWorkspaceStatus(workspaceName string, isActive bool) (*UpdateBoardStatusResponse, error) {
	endpoint := "/workspaces/status"
	body := struct {
		WorkspaceName string `json:"workspaceName"`
		IsActive      bool   `json:"isActive"`
	}{
		WorkspaceName: workspaceName,
		IsActive:      isActive,
	}
	var resp UpdateBoardStatusResponse
	err := s.client.doRequest("PUT", endpoint, body, &resp)
	return &resp, err
}
