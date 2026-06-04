package api

import "fmt"

type Workspace struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type WorkspacesResponse struct {
	Workspaces []Workspace `json:"workspaces"`
}

func GetUserWorkspaces() ([]Workspace, error) {
	var resp WorkspacesResponse
	err := doRequest("GET", "/workspaces", nil, &resp)
	return resp.Workspaces, err
}

func DeleteWorkspace(workspaceName string) error {
	endpoint := fmt.Sprintf("/workspaces/%s", workspaceName)
	return doRequest("DELETE", endpoint, nil, nil)
}

func RestoreWorkspace(workspaceName string) error {
	endpoint := fmt.Sprintf("/workspaces/%s/restore", workspaceName)
	return doRequest("POST", endpoint, nil, nil)
}

type UpdateWorkspaceStatusBody struct {
	IsActive bool `json:"isActive"`
}

func UpdateWorkspaceStatus(workspaceName string, isActive bool) error {
	endpoint := fmt.Sprintf("/workspaces/%s/status", workspaceName)
	body := UpdateWorkspaceStatusBody{IsActive: isActive}
	return doRequest("PUT", endpoint, body, nil)
}
